---
bump: patch
---

### Security
- Added a top-level `permissions: contents: read` block to `.github/workflows/release.yml` so jobs no longer inherit the repository's default `GITHUB_TOKEN` scope; jobs that need write access already escalate explicitly
