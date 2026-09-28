#!/usr/bin/env bash
# Build openagri_attestation with platform-tools v1.53 (rustc 1.89, edition2024).
# Default cargo-build-sbf on this machine is v1.48 / rustc 1.84 and cannot parse
# crates like block-buffer 0.12.1.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
unset CARGO_TARGET_DIR
export CARGO_TARGET_DIR="$ROOT/target"

TOOLS_VERSION="${SOLANA_PLATFORM_TOOLS_VERSION:-v1.53}"

cargo-build-sbf --tools-version "$TOOLS_VERSION" \
  --manifest-path programs/openagri_attestation/Cargo.toml

# Do not pass --tools-version through `anchor build`; the IDL step forwards it
# to `cargo test` and fails.
anchor idl build -p openagri_attestation

echo "so:   $ROOT/target/deploy/openagri_attestation.so"
echo "idl:  $ROOT/target/idl/openagri_attestation.json"
