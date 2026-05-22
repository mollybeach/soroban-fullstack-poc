# Soroban fullstack POC — common tasks from repo root
.DEFAULT_GOAL := help
SHELL := /bin/bash
# So `make` finds Homebrew-installed `stellar` the same way interactive zsh does
export PATH := $(HOME)/.cargo/bin:/opt/homebrew/bin:/usr/local/bin:$(PATH)

REPO_ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
CONTRACT_DIR := $(REPO_ROOT)/contracts/basic-storage
FRONTEND_DIR := $(REPO_ROOT)/frontend

# libFuzzer default is AddressSanitizer; on Apple hosts ASAN + soroban-sdk ctor/dtor hits a
# linker error ("initializer pointer has no target"). `-s none` still runs libFuzzer with
# coverage instrumentation; Linux/CI keeps the default ASAN for a stricter smoke run.
UNAME_S := $(shell uname -s 2>/dev/null || echo unknown)
ifeq ($(UNAME_S),Darwin)
FUZZ_SAN_FLAGS := -s none
else
FUZZ_SAN_FLAGS :=
endif

.PHONY: help install install-rust-target install-frontend fmt fmt-check format contract-test test contract-integration test-all-contract test-all sync-tests export-test-results contract-coverage coverage contract-fuzz-smoke fuzz lint clippy build build-contract build-frontend contract-interface-json contract-bindings check ci ci-coverage clean clean-frontend stellar-identity deploy dev dev-frontend test-frontend sync-frontend-tests macos-contract-source-help

macos-contract-source-help: ## macOS: dialog + Finder reveal + open lib.rs (DemoForge / sandbox file access)
	chmod +x "$(REPO_ROOT)/scripts/macos-open-contract-source.sh"
	"$(REPO_ROOT)/scripts/macos-open-contract-source.sh"

help: ## Show available targets and short descriptions
	@grep -E '^[a-zA-Z0-9_.-]+:.*?##' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}'

install-rust-target: ## Add wasm32v1-none (required for stellar contract build)
	rustup target add wasm32v1-none

install-frontend: ## Install frontend deps from lockfile (npm ci; fixes incomplete node_modules)
	cd "$(FRONTEND_DIR)" && npm ci

install: install-rust-target install-frontend ## Bootstrap Rust wasm target and frontend node_modules

fmt: ## Format Rust sources in contracts/basic-storage
	cd $(CONTRACT_DIR) && cargo fmt

format: fmt ## Alias: cargo fmt (POC deliverable naming)

fmt-check: ## Check Rust formatting without modifying files
	cd $(CONTRACT_DIR) && cargo fmt -- --check

contract-test: ## Run cargo test in contracts/basic-storage (unit + integration + proptest)
	cd $(CONTRACT_DIR) && cargo test

test: contract-test ## Run Rust contract tests (not frontend; use test-frontend for Vitest)

test-frontend: ## Run frontend Vitest (WalletConnect + all SWK wallet catalog) — needs install-frontend once
	cd "$(FRONTEND_DIR)" && npm test

sync-frontend-tests: test-frontend ## Run Vitest and merge results into frontend/public/test-results.json
	node "$(REPO_ROOT)/scripts/export-frontend-wallet-results.mjs"

contract-integration: ## Run only integration tests (tests/*.rs)
	cd $(CONTRACT_DIR) && cargo test --test integration_contract

# Log + exit code for export script (under target/, gitignored)
CONTRACT_TEST_LOG := $(CONTRACT_DIR)/target/.last-full-test.log
CONTRACT_TEST_EXIT := $(CONTRACT_DIR)/target/.last-full-test.exit

test-all-contract test-all: ## Run every contract-side test type: full `cargo test` + libFuzzer smoke (needs cargo-fuzz + nightly)
	@mkdir -p "$(CONTRACT_DIR)/target"
	bash -c 'set -o pipefail; cd "$(CONTRACT_DIR)" && cargo test 2>&1 | tee "$(CONTRACT_TEST_LOG)"; c=$${PIPESTATUS[0]}; echo $$c > "$(CONTRACT_TEST_EXIT)"; exit $$c'
	@if command -v cargo-fuzz >/dev/null 2>&1; then \
		if rustup which rustc --toolchain nightly >/dev/null 2>&1; then \
			cd "$(CONTRACT_DIR)/fuzz" && cargo +nightly fuzz run storage_set_get $(FUZZ_SAN_FLAGS) -- -runs=1000 \
				|| echo "warning: libFuzzer smoke failed (cargo test above still passed). Check cargo-fuzz, nightly, and Makefile FUZZ_SAN_FLAGS." >&2; \
		else \
			echo "note: rustup nightly not installed — skipping libFuzzer (install: rustup toolchain install nightly)"; \
		fi; \
	else \
		echo "note: cargo-fuzz not installed — skipping libFuzzer smoke (install: cargo install cargo-fuzz)"; \
	fi

sync-tests export-test-results: test-all-contract ## Run test-all-contract then write frontend/public/test-results.json (refreshes /tests)
	CONTRACT_TEST_LOG_PATH="$(CONTRACT_TEST_LOG)" CONTRACT_TEST_LOG_EXIT="$(CONTRACT_TEST_EXIT)" node "$(REPO_ROOT)/scripts/export-test-results.mjs"

contract-coverage: ## LLVM coverage: HTML + lcov + JSON summary for /tests (install: cargo install cargo-llvm-cov)
	@if ! cargo llvm-cov --version >/dev/null 2>&1; then \
		echo "error: cargo-llvm-cov not installed. Run: cargo install cargo-llvm-cov" >&2; \
		exit 1; \
	fi
	cd "$(CONTRACT_DIR)" && cargo llvm-cov test --html --output-dir target/llvm-cov-html
	cd "$(CONTRACT_DIR)" && cargo llvm-cov report --json --output-path target/llvm-cov-report.json
	cd "$(CONTRACT_DIR)" && cargo llvm-cov report --lcov --output-path target/llvm-cov.lcov
	node "$(REPO_ROOT)/scripts/export-coverage-summary.mjs" "$(CONTRACT_DIR)/target/llvm-cov-report.json"
	@echo ""
	@echo "HTML report: file://$(CONTRACT_DIR)/target/llvm-cov-html/html/index.html"
	@echo "LCOV: $(CONTRACT_DIR)/target/llvm-cov.lcov"
	@echo "JSON (machine-readable): $(CONTRACT_DIR)/target/llvm-cov-report.json"
	@echo "Frontend summary: $(FRONTEND_DIR)/public/coverage-summary.json"

coverage: contract-coverage ## Alias: measurable LLVM coverage (POC deliverable naming)

contract-fuzz-smoke: ## Short libFuzzer run (needs cargo-fuzz + nightly; Darwin uses -s none, others default ASAN)
	@if ! command -v cargo-fuzz >/dev/null 2>&1; then \
		echo "error: cargo-fuzz not installed. Run: cargo install cargo-fuzz" >&2; \
		exit 1; \
	fi
	@if ! rustup which rustc --toolchain nightly >/dev/null 2>&1; then \
		echo "error: nightly toolchain required for fuzz. Run: rustup toolchain install nightly" >&2; \
		exit 1; \
	fi
	cd "$(CONTRACT_DIR)/fuzz" && cargo +nightly fuzz run storage_set_get $(FUZZ_SAN_FLAGS) -- -runs=1000

fuzz: contract-fuzz-smoke ## Alias: short libFuzzer smoke (POC deliverable naming)

clippy: ## Run cargo clippy with warnings denied
	cd $(CONTRACT_DIR) && cargo clippy --all-targets -- -D warnings

lint: clippy ## Alias: cargo clippy -D warnings (POC deliverable naming)

build-contract: ## Build Soroban WASM (stellar if installed, else cargo release for wasm32v1-none)
	@if command -v stellar >/dev/null 2>&1; then \
		cd "$(CONTRACT_DIR)" && bash -c 'unset CARGO_TARGET_DIR; stellar contract build'; \
	else \
		echo "stellar: not in PATH — using cargo (install Stellar CLI for deploy: https://developers.stellar.org/docs/tools)" >&2; \
		cd "$(CONTRACT_DIR)" && cargo build --target wasm32v1-none --release && \
		if [ ! -f target/wasm32v1-none/release/basic_storage.wasm ]; then \
			dep=$$(ls target/wasm32v1-none/release/deps/basic_storage*.wasm 2>/dev/null | grep -v ' ' | head -n1); \
			if [ -n "$$dep" ] && [ -f "$$dep" ]; then cp "$$dep" target/wasm32v1-none/release/basic_storage.wasm; fi; \
		fi; \
	fi

BINDINGS_WASM := $(CONTRACT_DIR)/target/wasm32v1-none/release/basic_storage.wasm

# Formatted interface spec consumed by the /bindings page and tooling.
# Equivalent CLI (from repo root, after build): stellar contract info interface --wasm contracts/basic-storage/target/wasm32v1-none/release/basic_storage.wasm --output json-formatted
contract-interface-json: build-contract ## Dump formatted contract interface JSON to frontend/contract-spec/ (needs stellar CLI)
	@if ! command -v stellar >/dev/null 2>&1; then \
		echo "error: stellar CLI required for contract-interface-json" >&2; \
		exit 1; \
	fi
	@test -f "$(BINDINGS_WASM)" || (echo "error: missing wasm at $(BINDINGS_WASM) (build-contract failed?)" >&2 && exit 1)
	@mkdir -p "$(FRONTEND_DIR)/contract-spec"
	stellar contract info interface --wasm "$(BINDINGS_WASM)" --output json-formatted > "$(FRONTEND_DIR)/contract-spec/basic-storage-interface.json"
	@node -e 'const fs=require("fs"); const p="$(FRONTEND_DIR)/contract-spec/basic-storage-interface.meta.json"; fs.writeFileSync(p, JSON.stringify({ generatedAt: new Date().toISOString(), wasmRelative: "contracts/basic-storage/target/wasm32v1-none/release/basic_storage.wasm" }, null, 2) + "\n");'
	@echo "Updated: frontend/contract-spec/basic-storage-interface.json and basic-storage-interface.meta.json"

contract-bindings: contract-interface-json ## Refresh interface JSON + stellar contract bindings typescript (needs stellar CLI)
	rm -rf "$(FRONTEND_DIR)/lib/basic-storage-bindings"
	stellar contract bindings typescript --wasm "$(BINDINGS_WASM)" --output-dir "$(FRONTEND_DIR)/lib/basic-storage-bindings" --overwrite
	@echo "Updated: frontend/contract-spec/basic-storage-interface.json, basic-storage-interface.meta.json, and frontend/lib/basic-storage-bindings/"

build-frontend: ## Production Next.js build (npm ci only if react/cjs bundle is missing)
	cd "$(FRONTEND_DIR)" && \
	( [ -f node_modules/react/cjs/react.production.js ] || ( echo "npm: refreshing dependencies (react/cjs missing)" >&2 && npm ci ) ) && \
	npm run build

build: build-contract build-frontend ## Alias: WASM + Next production build (POC deliverable naming)

check: fmt-check clippy contract-test build-contract build-frontend ## Verify contract + frontend (auto npm ci when React tree is broken)

ci: install-rust-target install-frontend fmt-check clippy contract-test build-contract build-frontend ## Bootstrap then full verification (Rust target, npm, fmt, clippy, tests, wasm, Next build)

ci-coverage: install-rust-target install-frontend fmt-check clippy contract-test contract-coverage build-contract build-frontend ## Like ci, plus LLVM coverage (requires cargo-llvm-cov; slower)

clean: ## Remove contract target/ and Next.js .next/, out/, dist/
	rm -rf $(CONTRACT_DIR)/target $(FRONTEND_DIR)/.next $(FRONTEND_DIR)/out $(FRONTEND_DIR)/dist

clean-frontend: ## Remove frontend node_modules (next step: make install-frontend or make build-frontend)
	rm -rf "$(FRONTEND_DIR)/node_modules"

stellar-identity: ## Create and fund default testnet identity if missing (override: make stellar-identity NAME=my-alias)
	"$(REPO_ROOT)/scripts/setup-testnet-identity.sh" $(NAME)

deploy: ## Deploy to testnet (needs stellar; run stellar-identity once; optional SOURCE_ACCOUNT=my-alias)
	$(REPO_ROOT)/scripts/deploy-testnet.sh $(SOURCE_ACCOUNT)

dev: dev-frontend ## Alias: Next.js dev server at http://localhost:3000

dev-frontend: ## Start Next dev server (install-frontend first if needed)
	cd $(FRONTEND_DIR) && npm run dev
