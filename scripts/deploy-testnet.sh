#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONTRACT_DIR="$REPO_ROOT/contracts/basic-storage"
WASM_PATH="$CONTRACT_DIR/target/wasm32v1-none/release/basic_storage.wasm"
# Override with: ./scripts/deploy-testnet.sh my-alias  OR  STELLAR_SOURCE_ACCOUNT=my-alias ./scripts/deploy-testnet.sh
SOURCE_ACCOUNT="${STELLAR_SOURCE_ACCOUNT:-${1:-soroban-poc-deployer}}"

if ! command -v stellar >/dev/null 2>&1; then
  echo "error: 'stellar' not found on PATH. Deploy needs the Stellar CLI." >&2
  echo "  Install: https://developers.stellar.org/docs/tools/developer-tools/cli/install-cli" >&2
  echo "  Examples: brew install stellar-cli   OR   cargo install --locked stellar-cli" >&2
  exit 127
fi

cd "$CONTRACT_DIR"

stellar contract build

CONTRACT_ID=$(stellar contract deploy \
  --wasm "$WASM_PATH" \
  --source "$SOURCE_ACCOUNT" \
  --network testnet)

echo "CONTRACT_ID=$CONTRACT_ID"
