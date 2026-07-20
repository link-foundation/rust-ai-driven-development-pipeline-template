---
bump: patch
---

### Fixed
- File-size warning annotations are now emitted only for files changed by the current pull request or push, so unchanged files stop repeating the same warning on every run. The 1000-line hard limit and the full baseline report remain repository-wide.
