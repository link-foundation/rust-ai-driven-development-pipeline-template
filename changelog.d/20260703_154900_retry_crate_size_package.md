---
bump: patch
---

### Fixed
- Retry the crate-size `cargo package` step before reporting package-size guard failure so transient registry downloads do not fail releases immediately.
