---
bump: patch
---

### Fixed

- Report unreadable workspace member manifests before selecting a release package.
- Fail the file-size gate on read and traversal errors while still reporting other findings.
- Require spaces or tabs after changelog closing fences so example headings stay inside the fence.
- Verify exact crate versions in complete sparse index and crates.io API responses before reporting availability.
- Drain both GitHub CLI output streams while sending the release payload and surface incomplete writes.
