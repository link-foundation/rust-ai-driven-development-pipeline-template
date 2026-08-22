### Fixed
- `scripts/detect-code-changes.rs` now matches its exclusion list against paths relative to the detected Rust package root, so in the multi-language (`rust/Cargo.toml`) layout an `examples/`- or `changelog.d/`-only pull request is no longer reported as a code change (#139).
- Changes belonging to another language of a multi-language repository (for example `python/pyproject.toml`) are no longer reported as Rust changes; shared paths (`.github/`, `scripts/`, repository-root files) stay in scope.
