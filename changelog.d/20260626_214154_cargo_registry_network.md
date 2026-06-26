---
bump: patch
---

### Fixed
- Hardened Cargo registry downloads in the CI/CD workflow with additional retries and disabled HTTP multiplexing to reduce transient HTTP/2 framing failures.
