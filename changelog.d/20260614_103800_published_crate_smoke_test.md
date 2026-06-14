### Added
- Add a post-publish crates.io smoke test to the release workflow. The new `scripts/smoke-test-published-crate.rs` installs the exact published crate into a throwaway root, runs detected CLI binaries with captured `--help` output, and compiles a fresh dependent crate against the published library before Docker Hub or GitHub release artifacts are created.

### Fixed
- Harden the template CLI stdout path so `BrokenPipe` from a closed downstream reader is treated as a clean exit instead of a panic.
