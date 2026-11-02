---
bump: minor
---

### Added
- `rerun-infrastructure-failures.yml` automatically reruns, at most twice, a failed run whose job GitHub never handed to a hosted runner ("The job was not acquired by Runner of type hosted even after multiple attempts"), so a macOS capacity shortage no longer blocks a release on `main` until someone reruns it by hand. Jobs that ran steps and failed, and superseded runs, are never rerun (issue #226).

### Changed
- The Pipeline Status gate names jobs that never got a runner with a `Hosted runner not acquired` error. It stays red because nothing was tested; its job now has `actions: read` and `checks: read` to read the run's jobs and annotations.
