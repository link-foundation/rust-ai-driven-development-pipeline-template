Fixes #247

Merged dependency updates left an invalid Cargo graph, stale action-pin assertions and three CodeQL extraction errors. Regenerate the dependency graph and adapt the release scripts and checks to the current dependencies while preserving publication, integrity, refusal and JavaScript-first gates.

- Update every active Rust/Python/npm/action/hook/runtime/container dependency surface. Adopt Rust 2024 (MSRV 1.85; CI compiler 1.100), Node 26.13.1/npm 12.2.2 and Python 3.15.2. Add a universal hashed Python tool lock and updater coverage for Python, hooks and the Rust toolchain.
- Migrate ureq 3, TOML 1 and getrandom 0.4. Use TOML's document parser, upstream random integers and official Buildx pull retries; retain only the independent mirror adapter. Remove unused script dependencies.
- Preserve all existing acceptance assertions. Add actual Cargo-parser regressions, ensure nested Node gate tests execute, and keep CodeQL extraction warnings and advisory warnings fatal.

The [requirements and plan](https://github.com/link-foundation/rust-ai-driven-development-pipeline-template/blob/issue-247-606302267166/dev/log/issues/247/pulls/248/plan.md), [research](https://github.com/link-foundation/rust-ai-driven-development-pipeline-template/blob/issue-247-606302267166/dev/log/issues/247/pulls/248/research.md), [complete before/latest/after dependency table](https://github.com/link-foundation/rust-ai-driven-development-pipeline-template/blob/issue-247-606302267166/dev/log/issues/247/pulls/248/dependency-versions.md), [runtimes/tools/images](https://github.com/link-foundation/rust-ai-driven-development-pipeline-template/blob/issue-247-606302267166/dev/log/issues/247/pulls/248/runtime-and-images.md) and [verification evidence](https://github.com/link-foundation/rust-ai-driven-development-pipeline-template/blob/issue-247-606302267166/dev/log/issues/247/pulls/248/verification.md) include live registry data, migration decisions, all retained transitive constraints and compressed original CI logs. The dependency-free example's regenerated lock is byte-for-byte unchanged. Package versions remain owned by the release writer; the new changelog fragment triggers its next release.

Validation: native JavaScript and strict parity/regeneration first; complete Rust build/test/doc/Clippy and script regressions; example build/test/lint/package; every Python and shell file linted; workflow lint/security checks and all pre-commit hooks; fresh locked installs; Cargo, npm and Python audits with no unresolved advisories. Exact candidate GitHub CI is checked before marking this PR ready.

Current-release upstream reports (existing issues updated with reproductions and suggested fixes):

- [RustSec malformed-lock panic](https://github.com/rustsec/rustsec/issues/1241#issuecomment-6872305660)
- [download-artifact ZIP decoder](https://github.com/actions/download-artifact/issues/484#issuecomment-6872306034)
- [deploy-pages punycode deprecation](https://github.com/actions/deploy-pages/issues/434#issuecomment-6872306330)
- [actionlint queue syntax](https://github.com/rhysd/actionlint/issues/657#issuecomment-6872306583)
- [lychee connection resets](https://github.com/lycheeverse/lychee/issues/2297#issuecomment-6872306899)
- [Buildx mirror support](https://github.com/docker/setup-buildx-action/issues/510#issuecomment-6872307251)
- [CodeQL standalone Rust macro extraction](https://github.com/github/codeql/issues/19982#issuecomment-6872307530)

Necessary upstream workarounds remain covered. Fresh-merge CI validates these repairs against main; actual post-merge default-branch runs require separately authorized merging. This PR remains unmerged.
