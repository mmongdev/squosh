#!/usr/bin/env bash
# Starts the Squoosh watch build + static dev server on DEV_PORT (default 5000).
set -euo pipefail

cd "$(dirname "$0")/.."

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh"

NODE_VERSION="$(tr -d '[:space:]' < .nvmrc)"
export PATH="$NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH"

export DEV_PORT="${DEV_PORT:-5000}"
exec npm run dev
