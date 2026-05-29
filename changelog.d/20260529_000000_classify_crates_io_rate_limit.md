---
bump: patch
---

### Fixed
- `scripts/publish-crate.rs` now classifies crates.io HTTP 429 throttle responses ("You have published too many versions of this crate in the last 24 hours") as a dedicated `publish_result=rate_limited` outcome with an explanatory banner, instead of reporting them as a generic `failed` ("Failed to publish for unknown reason"). Failed-publish classification is consolidated through a single `classify_failure` function and `FailureKind` enum, covered by unit tests runnable via `rust-script --test scripts/publish-crate.rs`.
