# Soroban fullstack POC — common tasks from repo root
.DEFAULT_GOAL := help
SHELL := /bin/bash
# So `make` finds Homebrew-installed `stellar` the same way interactive zsh does
export PATH := $(HOME)/.cargo/bin:/opt/homebrew/bin:/usr/local/bin:$(PATH)

REPO_ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
CONTRACT_DIR := $(REPO_ROOT)/contracts/basic-storage
FRONTEND_DIR := $(REPO_ROOT)/frontend

.PHONY: help install install-rust-target install-frontend fmt fmt-check contract-test contract-integration export-test-results contract-coverage contract-fuzz-smoke clippy build-contract build-frontend check ci clean clean-frontend stellar-identity deploy dev-frontend

help: ## Show available targets and short descriptions
	@grep -E '^[a-zA-Z0-9_.-]+:.*?##' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}'

install-rust-target: ## Add wasm32v1-none (required for stellar contract build)
	rustup target add wasm32v1-none

install-frontend: ## Install frontend deps from lockfile (npm ci; fixes incomplete node_modules)
	cd "$(FRONTEND_DIR)" && npm ci

install: install-rust-target install-frontend ## Bootstrap Rust wasm target and frontend node_modules

fmt: ## Format Rust sources in contracts/basic-storage
	cd $(CONTRACT_DIR) && cargo fmt

fmt-check: ## Check Rust formatting without modifying files
	cd $(CONTRACT_DIR) && cargo fmt -- --check

contract-test: ## Run cargo test in contracts/basic-storage (unit + integration + proptest)
	cd $(CONTRACT_DIR) && cargo test

contract-integration: ## Run only integration tests (tests/*.rs)
	cd $(CONTRACT_DIR) && cargo test --test integration_contract

export-test-results: ## Write frontend/public/test-results.json for the /tests page (requires cargo)
	node "$(REPO_ROOT)/scripts/export-test-results.mjs"

contract-coverage: ## LLVM coverage: HTML report + lcov + terminal summary (install: cargo install cargo-llvm-cov; first run may add llvm-tools-preview)
	@if ! cargo llvm-cov --version >/dev/null 2>&1; then \
		echo "error: cargo-llvm-cov not installed. Run: cargo install cargo-llvm-cov" >&2; \
		exit 1; \
	fi
	cd "$(CONTRACT_DIR)" && cargo llvm-cov test --html --output-dir target/llvm-cov-html
	cd "$(CONTRACT_DIR)" && cargo llvm-cov report --text
	cd "$(CONTRACT_DIR)" && cargo llvm-cov report --lcov --output-path target/llvm-cov.lcov
	@echo ""
	@echo "HTML report: file://$(CONTRACT_DIR)/target/llvm-cov-html/html/index.html"
	@echo "LCOV (CI / genhtml): $(CONTRACT_DIR)/target/llvm-cov.lcov"

contract-fuzz-smoke: ## Short libFuzzer run (install: cargo install cargo-fuzz)
	@if ! command -v cargo-fuzz >/dev/null 2>&1; then \
		echo "error: cargo-fuzz not installed. Run: cargo install cargo-fuzz" >&2; \
		exit 1; \
	fi
	cd "$(CONTRACT_DIR)/fuzz" && cargo fuzz run storage_set_get -- -runs=1000

clippy: ## Run cargo clippy with warnings denied
	cd $(CONTRACT_DIR) && cargo clippy --all-targets -- -D warnings

build-contract: ## Build Soroban WASM (stellar if installed, else cargo release for wasm32v1-none)
	@if command -v stellar >/dev/null 2>&1; then \
		cd "$(CONTRACT_DIR)" && stellar contract build; \
	else \
		echo "stellar: not in PATH — using cargo (install Stellar CLI for deploy: https://developers.stellar.org/docs/tools)" >&2; \
		cd "$(CONTRACT_DIR)" && cargo build --target wasm32v1-none --release; \
	fi

build-frontend: ## Production Next.js build (npm ci only if react/cjs bundle is missing)
	cd "$(FRONTEND_DIR)" && \
	( [ -f node_modules/react/cjs/react.production.js ] || ( echo "npm: refreshing dependencies (react/cjs missing)" >&2 && npm ci ) ) && \
	npm run build

check: fmt-check clippy contract-test build-contract build-frontend ## Verify contract + frontend (auto npm ci when React tree is broken)

ci: install-rust-target install-frontend fmt-check clippy contract-test build-contract build-frontend ## Bootstrap then full verification (Rust target, npm, fmt, clippy, tests, wasm, Next build)

clean: ## Remove contract target/ and Next.js .next/, out/, dist/
	rm -rf $(CONTRACT_DIR)/target $(FRONTEND_DIR)/.next $(FRONTEND_DIR)/out $(FRONTEND_DIR)/dist

clean-frontend: ## Remove frontend node_modules (next step: make install-frontend or make build-frontend)
	rm -rf "$(FRONTEND_DIR)/node_modules"

stellar-identity: ## Create and fund default testnet identity if missing (override: make stellar-identity NAME=my-alias)
	"$(REPO_ROOT)/scripts/setup-testnet-identity.sh" $(NAME)

deploy: ## Deploy to testnet (needs stellar; run stellar-identity once; optional SOURCE_ACCOUNT=my-alias)
	$(REPO_ROOT)/scripts/deploy-testnet.sh $(SOURCE_ACCOUNT)

dev-frontend: ## Start Next dev server (install-frontend first if needed)
	cd $(FRONTEND_DIR) && npm run dev
