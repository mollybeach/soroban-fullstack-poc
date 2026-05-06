#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONTRACT_DIR="$REPO_ROOT/contracts/basic-storage"
WASM_PATH="$CONTRACT_DIR/target/wasm32v1-none/release/basic_storage.wasm"
SOURCE_ACCOUNT="${1:-molly-testnet}"

cd "$CONTRACT_DIR"

stellar contract build

CONTRACT_ID=$(stellar contract deploy \
  --wasm "$WASM_PATH" \
  --source "$SOURCE_ACCOUNT" \
  --network testnet)

echo "CONTRACT_ID=$CONTRACT_ID"
