---
bump: patch
---

### Fixed
- `scripts/wait-for-crate.rs` no longer reports a successful release as failed when crates.io answers 403, 429 or a 5xx. The probe returns a `Visibility` (`Published` / `NotPublishedYet` / `Unknown`) instead of a bare `bool`, and when no attempt ever got a definitive answer the error says the release status is unknown and how to verify it against the sparse index, rather than claiming the version was never published (#143).

### Changed
- The crates.io wait probes the sparse index (`https://index.crates.io`), which is what `cargo` resolves against and is not rate limited, falling back to the JSON API.
- The wait's `User-Agent` now carries contact information, as crates.io asks of its clients.
