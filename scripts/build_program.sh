#!/usr/bin/env bash
# Build ghost_pool with Solana 1.18 cargo-build-sbf + platform-tools v1.52
# (Rust 1.89). Needed because crates.io 2026 editions require edition2024.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$ROOT/node_modules/.bin:$HOME/.local/share/solana/install/active_release/bin:$PATH"
rustup default 1.85.0 >/dev/null
mkdir -p "$ROOT/target/deploy"
cp "$ROOT/keys/ghost_pool-keypair.json" "$ROOT/target/deploy/ghost_pool-keypair.json"
cd "$ROOT"
cargo-build-sbf \
  --tools-version v1.52 \
  --manifest-path programs/ghost_pool/Cargo.toml \
  --sbf-out-dir "$ROOT/target/deploy"

# IDL from the compiled crate (Anchor 0.30)
if command -v anchor >/dev/null; then
  mkdir -p target/idl target/types
  npx anchor idl build -p ghost_pool -o target/idl/ghost_pool.json --provider.cluster localnet 2>/dev/null \
    || npx anchor idl parse --file programs/ghost_pool/src/lib.rs --out target/idl/ghost_pool.json \
    || echo "WARN: could not generate IDL via anchor; using committed copies"
  if [ -f target/idl/ghost_pool.json ]; then
    cp target/idl/ghost_pool.json relayer/idl/ghost_pool.json
    cp target/idl/ghost_pool.json frontend/idl/ghost_pool.json
  fi
fi
echo "Built $ROOT/target/deploy/ghost_pool.so"
