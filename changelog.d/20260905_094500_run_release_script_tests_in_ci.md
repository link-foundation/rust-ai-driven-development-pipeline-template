---
bump: patch
---

### Fixed
- Run the release-script unit tests in CI. `scripts/*.rs` carried 78 `#[test]` functions across nine rust-scripts and no workflow ran any of them: `cargo test` only builds the library crate, so the release-script regression guards -- including the rebase-before-stage ordering check in `version-and-commit.rs` -- had never executed. Two suites had rotted unnoticed as a result: `create-github-release.rs` did not compile in test mode (it declared `release_naming` only under `#[cfg(not(test))]` and substituted a `super::` path that does not exist when `rust-script --test` builds the file as its own crate root), and `version-and-commit.rs` and `wait-for-crate.rs` failed under the workflow-level `RUSTFLAGS: -Dwarnings` because a test harness has no `main`, leaving every `main`-only helper unused (#150).

### Added
- `scripts/test-scripts.sh` runs the inline `#[cfg(test)]` suite of every rust-script under `scripts/`, under the same `-Dwarnings` CI uses, reporting every failing suite instead of stopping at the first. A new `script-tests` job runs it, `build` is gated on it so a broken release script cannot reach `auto-release`, and `pipeline-status` observes it (#150).
