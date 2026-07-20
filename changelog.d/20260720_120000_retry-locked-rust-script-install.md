---
bump: patch
---

### Fixed
- Release workflow no longer runs bare `cargo install rust-script`. All nine call sites now use `scripts/install-rust-script.sh`, which short-circuits when `rust-script` is already present, installs with `--locked` for reproducible builds, and retries up to 3 times with backoff so a transient crates.io failure does not fail a release.
