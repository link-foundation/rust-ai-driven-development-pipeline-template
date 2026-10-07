---
bump: patch
---

### Fixed
- Recognize replacement changelog fragments while excluding unchanged fragment moves, regardless of Git's rename configuration.
- Detect both paths of source moves so moving code into excluded folders still requires a changelog fragment and runs the code CI jobs.
