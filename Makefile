# Soroban fullstack POC — common tasks from repo root
.DEFAULT_GOAL := help
SHELL := /bin/bash

REPO_ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
CONTRACT_DIR := $(REPO_ROOT)/contracts/basic-storage
FRONTEND_DIR := $(REPO_ROOT)/frontend

.PHONY: help install install-rust-target install-frontend fmt fmt-check contract-test clippy build-contract build-frontend check ci clean clean-frontend deploy dev-frontend

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

contract-test: ## Run cargo test in contracts/basic-storage
	cd $(CONTRACT_DIR) && cargo test

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

ci: install-rust-target install-frontend fmt-check clippy contract-test build-contract build-frontend ## Bootstrap then run full verification (Rust target, npm, fmt, clippy, tests, wasm, Next build)

clean: ## Remove contract target/ and Next.js .next/, out/, dist/
	rm -rf $(CONTRACT_DIR)/target $(FRONTEND_DIR)/.next $(FRONTEND_DIR)/out $(FRONTEND_DIR)/dist

clean-frontend: ## Remove frontend node_modules (next step: make install-frontend or make build-frontend)
	rm -rf "$(FRONTEND_DIR)/node_modules"

deploy: ## Deploy WASM to Stellar testnet (optional: make deploy SOURCE_ACCOUNT=my-alias)
	$(REPO_ROOT)/scripts/deploy-testnet.sh $(SOURCE_ACCOUNT)

dev-frontend: ## Start Next dev server (install-frontend first if needed)
	cd $(FRONTEND_DIR) && npm run dev
