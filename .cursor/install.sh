#!/usr/bin/env bash
# Idempotent dependency setup for the Squoosh Cloud Agent environment.
set -euo pipefail

cd "$(dirname "$0")/.."

# Load nvm and install the Node version pinned in .nvmrc (20.16.0).
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh"
nvm install
nvm use

# The base image ships a `node` shim earlier in PATH, so pin the nvm-installed
# Node explicitly for the rest of this script.
NODE_VERSION="$(tr -d '[:space:]' < .nvmrc)"
export PATH="$NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH"

node -v
npm -v

# Reproducible install from the committed lockfile.
npm ci
