---
bump: patch
---

### Fixed
- `scripts/version-and-commit.rs`: create the release tag after the push-retry loop succeeds, so a `pull --rebase` retry can no longer leave the tag on an orphaned pre-rebase commit (#94)
