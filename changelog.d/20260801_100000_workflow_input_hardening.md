---
bump: patch
---

### Security
- Prevent workflow-dispatch inputs from being interpolated directly into release shell scripts

### Fixed
- Cancel superseded read-only CI jobs independently while preserving all queued write-capable jobs and running them one at a time
