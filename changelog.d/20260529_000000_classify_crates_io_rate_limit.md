---
bump: patch
---

### Fixed
- `scripts/publish-crate.rs` now treats crates.io HTTP 429 throttle responses ("You have published too many versions of this crate in the last 24 hours") as a deferred `publish_result=rate_limited` outcome (it writes the output, prints an explanatory banner and exits successfully) instead of a hard CI failure reported as a generic `failed` ("Failed to publish for unknown reason"). Authentication, already-published and unknown failures still exit non-zero. Failed-publish classification is consolidated through a single `classify_failure` function and `FailureKind` enum (with an `is_deferred` predicate), covered by unit tests runnable via `rust-script --test scripts/publish-crate.rs`.
- The release workflow (`.github/workflows/release.yml`) now gates crate-availability waiting, Docker Hub publishing and GitHub release creation on either an already-published crate or `publish_result=success`, so a deferred (rate-limited) crate upload no longer produces partial downstream release artifacts and the same version is retried automatically on the next push to `main`.
