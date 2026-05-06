#!/bin/bash
# Create a Stellar CLI identity and fund it on testnet (friendbot) if it does not exist yet.
# Usage: ./scripts/setup-testnet-identity.sh [NAME]
# Default NAME: soroban-poc-deployer
set -euo pipefail

export PATH="${HOME}/.cargo/bin:/opt/homebrew/bin:/usr/local/bin:${PATH}"

NAME="${1:-soroban-poc-deployer}"

if ! command -v stellar >/dev/null 2>&1; then
  echo "error: 'stellar' not found on PATH." >&2
  echo "  Add Homebrew to PATH, e.g. export PATH=\"/opt/homebrew/bin:\$PATH\"" >&2
  echo "  Install: https://developers.stellar.org/docs/tools/developer-tools/cli/install-cli" >&2
  exit 127
fi

if stellar keys public-key "$NAME" >/dev/null 2>&1; then
  echo "Identity '$NAME' already exists: $(stellar keys public-key "$NAME")"
  exit 0
fi

stellar keys generate "$NAME" --fund --network testnet
echo "Created and funded identity '$NAME' on testnet."
echo "Public key: $(stellar keys public-key "$NAME")"
echo "Deploy with: make deploy SOURCE_ACCOUNT=$NAME   (or it is the repo default if unchanged)"
