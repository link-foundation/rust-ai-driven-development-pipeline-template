Current consumer verification for v8.0.2 (`9000827ccba6bdab643e8b6fd33ac0654aef8333`): this extraction-chain workaround is still necessary in https://github.com/link-foundation/rust-ai-driven-development-pipeline-template/pull/248 .

Minimal workflow remains a normal artifact download with `NODE_OPTIONS: --throw-deprecation`; the vendored MatcherStream/Buffer reproducer in the earlier comment isolates DEP0005 without credentials. Our composite retains `skip-decompress: true`, SHA-256 mismatch failure, and validated Python ZIP extraction. Its regression suite covers traversal, symlinks, corrupt archives, merging and actual artifact round trips.

Suggested upstream fix remains replacing the obsolete ZIP/Buffer code and rebuilding the shipped bundle; test real extraction with deprecations fatal. Existing PR #490 is still open. We keep this report linked rather than open a duplicate.
