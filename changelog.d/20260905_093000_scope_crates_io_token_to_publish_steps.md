---
bump: patch
---

### Fixed
- Stop handing the crates.io publish credentials to every job in `release.yml`. `CARGO_REGISTRY_TOKEN` and `CARGO_TOKEN` were declared in the workflow-level `env:`, which is inherited by every job — including the `pull_request` jobs that compile and run code from the branch under review (`build.rs`, procedural macros, tests), so any branch pull request could read the publish token. The credentials now live only on the two publish steps that need them (#149).
