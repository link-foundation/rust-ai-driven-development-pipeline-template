---
bump: patch
---

### Fixed
- `scripts/check-web-archive.mjs` no longer reports `all_archived=true` when lychee's only errors are non-HTTP links. Missing local files and unresolvable root-relative links (`[ERROR] <file:///...>`, `[ERROR] <error:>`) are now parsed, annotated as errors, and make the script exit non-zero instead of being silently dropped ([#136](https://github.com/link-foundation/rust-ai-driven-development-pipeline-template/issues/136)).

### Added
- Regression tests for the lychee report parser (`scripts/check-web-archive.test.mjs`) backed by a captured lychee report fixture (`scripts/fixtures/lychee-report.md`).
