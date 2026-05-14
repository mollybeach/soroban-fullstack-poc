#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONTRACT_DIR="$REPO_ROOT/contracts/basic-storage"
RELEASE_DIR="$CONTRACT_DIR/target/wasm32v1-none/release"
WASM_PATH="$RELEASE_DIR/basic_storage.wasm"
# Override with: ./scripts/deploy-testnet.sh my-alias  OR  STELLAR_SOURCE_ACCOUNT=my-alias ./scripts/deploy-testnet.sh
SOURCE_ACCOUNT="${STELLAR_SOURCE_ACCOUNT:-${1:-soroban-poc-deployer}}"

if ! command -v stellar >/dev/null 2>&1; then
  echo "error: 'stellar' not found on PATH. Deploy needs the Stellar CLI." >&2
  echo "  Install: https://developers.stellar.org/docs/tools/developer-tools/cli/install-cli" >&2
  echo "  Examples: brew install stellar-cli   OR   cargo install --locked stellar-cli" >&2
  exit 127
fi

cd "$CONTRACT_DIR"

# Always copy wasm into the repo: when CARGO_TARGET_DIR points outside the tree,
# `stellar contract build` alone leaves `target/.../basic_storage.wasm` stale and
# deploy would upload an old 4-field contract while the build log shows the new spec.
mkdir -p "$RELEASE_DIR"
stellar contract build --out-dir "$RELEASE_DIR"

if [[ ! -f "$WASM_PATH" ]]; then
  echo "error: expected wasm at $WASM_PATH after stellar contract build --out-dir" >&2
  exit 1
fi

CONTRACT_ID=$(stellar contract deploy \
  --wasm "$WASM_PATH" \
  --source "$SOURCE_ACCOUNT" \
  --network testnet)

echo "CONTRACT_ID=$CONTRACT_ID"

FRONTEND_SPEC="$REPO_ROOT/frontend/contract-spec/poc-contract-deploy.meta.json"
mkdir -p "$(dirname "$FRONTEND_SPEC")"
node -e "const fs=require('fs'); const p=process.argv[1]; const id=process.argv[2]; fs.writeFileSync(p, JSON.stringify({ contractId: id, deployedAt: new Date().toISOString() }, null, 2) + '\n');" "$FRONTEND_SPEC" "$CONTRACT_ID"
echo "Wrote deploy metadata (contract id + deployedAt): $FRONTEND_SPEC"
