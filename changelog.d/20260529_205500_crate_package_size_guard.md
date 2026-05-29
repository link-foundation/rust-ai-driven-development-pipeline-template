---
bump: minor
---

### Added
- Added a `scripts/check-crate-size.rs` guard that builds the `.crate` archive and fails the release before publishing when it exceeds the crates.io 10 MiB upload limit. The check runs in the build job and before publishing in both the auto-release and manual-release jobs.

### Changed
- Added a narrow `include` allowlist to `Cargo.toml` so docs, case studies, generated CI artifacts, changelog fragments, scripts, and experiments no longer inflate the published release archive.
