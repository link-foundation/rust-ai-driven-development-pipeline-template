---
bump: patch
---

### Fixed
- Keep all pull-request code changes covered after documentation follow-ups.
- Validate lychee timeouts and checker exit codes, report all CodeQL problems safely, and run weekly link checks.
- Restore caches on pull requests while saving only from successful main pushes; invoke pinned ShellCheck without recurring pipx warnings.
- Apply source size limits to JavaScript helpers and preserve Rust releases across independent sibling-language releases.
