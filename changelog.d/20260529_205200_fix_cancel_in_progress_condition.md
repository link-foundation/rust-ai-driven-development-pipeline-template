---
bump: patch
---

### Fixed
- Fixed reversed `cancel-in-progress` concurrency condition in `release.yml` that cancelled in-flight releases on `main` and never superseded older PR runs. The condition now uses `!=` so `main` releases run to completion while newer PR pushes cancel stale runs.
