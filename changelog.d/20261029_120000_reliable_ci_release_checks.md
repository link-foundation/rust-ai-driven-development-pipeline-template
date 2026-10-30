---
bump: patch
---

### Fixed
- Check source file sizes using relative path components, including `.github` and files whose names contain `target`.
- Retry transient registry and Wayback failures and stop release or archive decisions when the lookup remains unavailable.
- Reject missing or malformed link reports and unresolved CodeQL findings while retaining diagnostic artifacts.
- Preserve fenced changelog examples and all following release notes; refuse missing required entries.
- Download digest-verified artifact ZIPs without deprecated Buffer constructors and safely extract them with Python.
- Keep macOS arm64 desktop builds running on the supported macOS 15 runner after macOS 14 brownouts.
