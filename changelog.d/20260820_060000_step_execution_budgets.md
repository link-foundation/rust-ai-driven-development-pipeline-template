---
bump: patch
---

### Added
- `scripts/run-with-budget-warning.sh`: runs a command under an explicit execution budget, warns at 70% of it, terminates the command's whole process group when it expires, and exits `124` with a `::error` annotation naming the budget and the overrun.
- CI invariant tests (`tests/unit/ci-cd/issue_135.rs`): every workflow job declares `timeout-minutes`, and every step budget stays at or below 70% of its job's cap.

### Fixed
- A step that outran its job's `timeout-minutes` was reported by GitHub as `cancelled` rather than `failed`, which `check-pipeline-status.sh` only escalated to an error on `main`. The long steps in `release.yml` (`test`, `coverage`, `fresh-merge`) now own a deadline that expires before the job cap, so a real timeout fails the job on any ref.
- The non-default-ref warning in `check-pipeline-status.sh` now names the `has exceeded the maximum execution time` annotation, so a genuine timeout on a pull request is searchable instead of silent.
