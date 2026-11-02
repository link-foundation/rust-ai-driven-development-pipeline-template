---
bump: minor
---

### Changed
- Automatically require native JavaScript, strict parity and regeneration checks when a production counterpart is detected, while preserving Rust-only projects. Bind Rust CI, desktop builds and release candidates to the successful prerequisite's exact revision.

### Added
- Regression coverage for automatic detection, Rust-only bypasses, failed or skipped prerequisites, incomplete inventories, generated drift and every downstream Rust dependency.
- Validate alternative candidate provenance before checking out code in default-branch cache contexts; enforce tested-revision equality before release-tag builds.
