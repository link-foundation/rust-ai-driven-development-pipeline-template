---
bump: patch
---

### Fixed
- `version-and-commit.rs`: rebase onto the remote branch **before** staging the version bump. `git rebase` refuses to run with a dirty index, so staging first caused the release job to abort with "cannot rebase: Your index contains uncommitted changes" whenever a concurrent release advanced the remote branch. The fetch + rebase now runs while the working tree is clean, matching the JavaScript template's ordering (#67).
