### Fixed

- `version-and-commit.rs` no longer reports "Local branch is behind remote" when the branch merely differs from (or is ahead of) `origin/<branch>`. It now counts `HEAD..origin/<branch>` and rebases only when actually behind, logging the real commit count (#95).
