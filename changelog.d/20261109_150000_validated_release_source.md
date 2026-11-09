---
bump: patch
---

### Fixed
- Cancel superseded read-only CI jobs on main and pull requests while preserving queued, non-cancelling repository and registry writers.
- Refuse untested source or dependency changes before release synchronization and push retries; allow only equivalent manifest/lock release versions, changelogs and consumed fragments.
