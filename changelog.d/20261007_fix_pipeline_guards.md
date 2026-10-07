---
bump: patch
---

### Fixed
- Pin CI runners, rust-script and security scanners, and check tool installation in every job.
- Reject manual version changes, reused changelog fragments, Cargo manifest warnings and unrelated release-index changes.
- Verify scoped crates.io credentials through a metadata-only publish probe and keep publication tokens out of Cargo arguments.
- Retry transient link failures with bounded backoff, exclude experiments from CodeQL, remove duplicate doc tests and increase registry propagation wait margin.
