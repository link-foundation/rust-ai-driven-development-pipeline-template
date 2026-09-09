---
bump: minor
---

### Added
- `release-preflight` job proves the crates.io and Docker Hub credentials can actually publish before the release matrix spends its minutes (#163, #167)
- `validate-docs` job verifies every required document and section, and `check-file-size.rs` now measures markdown against its own larger budget (#161)
- The link checker re-asks exactly the failures where no host ever answered and releases the run when they all recover; the Wayback lookup skips the recovered URLs (#168)

### Changed
- The pipeline status gate runs in every workflow and can tell a superseded run from a timeout on main (#156)
- cargo audit denies warnings, so `unmaintained`, `unsound` and `yanked` findings fail the gate (#164)
- actionlint is digest-pinned to 1.7.12 and the zizmor CLI version is named explicitly, matching the pin-everything policy (#160, #165, #166)
- Each buildx platform writes to its own GHA cache scope, so separate builds no longer evict each other (#154)

### Fixed
- `run-with-budget-warning.sh` measures elapsed wall-clock time, so a non-integer poll setting can no longer silently disable enforcement (#153)
- `rust-paths.rs` reads the crate name and version from the `[package]` table only, instead of a table-blind regex (#155)
- A transient `git fetch` failure no longer fails the whole fresh-merge job (#157)
- The leaked hive-mind `.gitkeep` placeholder is removed from the default branch (#158)
- The version commit is linted, formatted and tested before it is pushed to main (#159)
- Push retries classify GH006/GH013 ruleset rejections instead of rebasing three times and reporting the wrong cause (#162)
