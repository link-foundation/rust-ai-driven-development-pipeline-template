---
bump: patch
---

### Fixed
- Avoid false-positive Rust CI failures by scoping Cargo cache keys per job, skipping `target` cache uploads on Windows tests, giving the test matrix cleanup headroom, and only running Codecov uploads when `CODECOV_TOKEN` is configured.
