# Research and migration decisions

All versions are queried from live registries on 2026-11-14, rather than inferred
from local installed tools. `dependencies-before.json` is the initial inventory;
`registry-latest.json` preserves registry metadata. Historical case studies,
reproducers and mock version strings describe past behavior, not active pins.

## Existing components and alternatives

- [cargo-edit](https://github.com/killercup/cargo-edit) rewrites Cargo requirements
  across incompatible versions; Cargo regenerates and validates dependency graphs.
  This avoids manually repairing a malformed lockfile. The malformed root lock
  contains two identical syn 3 packages and references a nonexistent syn 2 package.
- [npm-check-updates](https://github.com/raineorshine/npm-check-updates) queries npm
  latest tags across majors. npm installs regenerate transitive locks; forced
  transitive major overrides would bypass the parent's API requirements. Every
  retained parent constraint is recorded in the version tables.
- [uv](https://docs.astral.sh/uv/pip/compile/) resolves universal, hashed Python
  requirements. Python source uses the standard library; the actual missing
  manifest is for developer/CI tools installed by shell commands.
- [Dependabot ecosystem reference](https://docs.github.com/en/code-security/reference/supply-chain-security/supported-ecosystems-and-repositories)
  now includes `pre-commit` and `rust-toolchain`. Extend the existing offline
  dependency-policy checker to cover these and real Python requirements instead
  of configuring nonexistent application dependencies. Renovate is an alternative,
  but adding a second updater would duplicate the existing Dependabot service.
- [RustSec cargo-audit](https://github.com/RustSec/rustsec/tree/main/cargo-audit),
  npm audit and [pip-audit](https://github.com/pypa/pip-audit) inspect actual locked
  trees. The CodeQL SARIF checker must continue to reject incomplete extraction.

## Breaking migrations

### ureq 2 to 3.5.2

Read the [migration guide](https://github.com/algesten/ureq/blob/main/MIGRATE-2-to-3.md),
[changelog](https://github.com/algesten/ureq/blob/main/CHANGELOG.md) and
[API documentation](https://docs.rs/ureq/3.5.2/ureq/).
The client uses standard HTTP header/status APIs, `Agent::config_builder`, and
`body_mut().read_to_string()`. Preserve the original global/connect/read/write
budgets, not just a connection deadline. Version 3 removes implicit idempotent
retries, so the existing bounded explicit retries remain necessary. Preserve
404-as-absence, retry 429/5xx/transport/unreadable bodies, and refuse other statuses.
Existing local mock-server tests exercise these policies without live publishing.

### toml 0.8 through 0.9 to 1.2.1

Read [the changelog](https://github.com/toml-rs/toml/blob/main/crates/toml/CHANGELOG.md),
including the intermediate 0.9 compatibility section. The scripts use
`toml::Value` and `from_str`, not the removed deserializer API or changed datetime
field types. Run the existing manifest/version regressions on the new parser,
including invalid/missing manifests and workspace dependency handling.

### getrandom 0.2 through 0.3 to 0.4.3

Read [the changelog](https://github.com/rust-random/getrandom/blob/master/CHANGELOG.md).
0.3 renamed `getrandom` to `fill` and introduced integer generation. 0.4 adopts
Rust 2024 and MSRV 1.85. Use two upstream `u64()` values for the 128-bit
stop-commands token, deleting local byte-array/per-byte hex-assembly logic.
Version 0.4.3 exposes u32/u64, not u128; two independent CSPRNG words preserve
128 bits of entropy. Preserve
unpredictability, fixed length and error propagation.

### pre-commit-hooks 5 to 6

Read [v6 migration notes](https://github.com/pre-commit/pre-commit-hooks/releases/tag/v6.0.0).
Python >=3.9 is required. None of this repository's configured hooks was removed;
the removed byte-order-marker/encoding-pragma hooks are not configured here.

### Rust 2024 and current stable

[Rust 2024](https://doc.rust-lang.org/edition-guide/rust-2024/index.html) is stable
since 1.85. [Rust 1.100.0 release](https://blog.rust-lang.org/2026/11/12/Rust-1.100.0/)
is the current stable. Pin build runtime to that release and raise the advertised
floor to 1.85, the highest requirement of the current production dependency tree,
rather than retain an impossible 1.70 claim. The build runtime remains 1.100.0;
CodeQL currently supplies its own compiler, so claiming 1.100 as the library MSRV
would also prevent supported extraction.
Use one build process and no local debug information. The existing `stable`
rustup installation is on a different mount and updating it fails with EXDEV;
installing named 1.100.0 succeeds without deleting or rewriting user caches.

## Initial failing checks

Main's Cargo parser and cargo-audit failures share the malformed dependency tree.
The release test compares a literal old crates-io-auth-action hash instead of the
security property: a full immutable action revision with OIDC permission and
credential validation before build/publish. Replace the stale hash assertion with
an immutable-revision assertion while retaining ordering and scope checks.
CodeQL fails on three serde_json::json! fixtures in a standalone rust-script:
use parsed JSON fixtures to retain the test cases and remove the macro extraction
limitation. Do not disable the extraction-warning gate.

## Authorization boundary

PR verification and a fresh-merge simulation can demonstrate that the changes
repair the default branch's failures. Actual green runs after merging into main
require merge authorization, which was explicitly separated from push permission.
No merge, release or deployment will be performed as part of this task.

## Additional migration findings

TOML 1 changes `Value::from_str` to parse a TOML value rather than a whole
manifest. The release source guard must call `toml::from_str` for document input.
The existing release-sync regression reproduced failures with valid `[package]`
input before that fix; all sixteen release-sync tests pass afterward.

Read [Node 26 breaking changes](https://nodejs.org/en/blog/release/v26.0.0),
[npm 12 release notes](https://github.com/npm/cli/releases/tag/v12.0.0), and
[Python 3.15 porting notes](https://docs.python.org/3.15/whatsnew/3.15.html).
Node's nested test-runner environment must not leak into child gate invocations:
remove NODE_TEST_CONTEXT in isolated fixtures and assert all eight native tests
actually execute. npm 12 changes JSON output shapes and blocks install scripts
by default; no repository code consumes affected npm JSON commands, and CI
already disables dependency install scripts. Explicitly install npm 12.2.2 rather
than relying on Node 26.13.1's older bundled npm. Python 3.15's UTF-8 default and
stdlib changes require no application migration; all Python regressions and
lint/audit run with the current security patch 3.15.2.

The latest [setup-buildx retry feature](https://github.com/docker/setup-buildx-action/pull/609)
pre-pulls the image even when cached. The old local pre-pull/mirror-retag loop
therefore no longer avoids the canonical registry during setup. Delete the local
retry/backoff implementation and let the official action own retries. The small
remaining adapter invokes the official action with an independent mirror image
only after canonical failure. Its real YAML wiring and shell block are exercised
with mocked remote results: canonical success, mirror recovery, both failures and
disabled mirrors. This adapter is infrastructure tooling, not a production Rust
counterpart or an incomplete application port.

## Upstream workaround inventory

Every report below includes current affected versions, a reproduction, the local
workaround and a suggested upstream fix. Existing reports were read and updated
instead of opening duplicates. The request and posted-comment snapshots are in
`upstream-reports/`.

- [cargo-audit malformed-lock panic](https://github.com/rustsec/rustsec/issues/1241#issuecomment-6872305660)
- [download-artifact obsolete ZIP decoder](https://github.com/actions/download-artifact/issues/484#issuecomment-6872306034)
- [deploy-pages core punycode deprecation](https://github.com/actions/deploy-pages/issues/434#issuecomment-6872306330)
- [actionlint queue syntax support](https://github.com/rhysd/actionlint/issues/657#issuecomment-6872306583)
- [lychee connection-reset retries](https://github.com/lycheeverse/lychee/issues/2297#issuecomment-6872306899)
- [setup-buildx independent registry mirror input](https://github.com/docker/setup-buildx-action/issues/510#issuecomment-6872307251)
- [CodeQL standalone Rust macro extraction](https://github.com/github/codeql/issues/19982#issuecomment-6872307530)

The artifact validation/extraction adapter, narrow known-deprecation filters,
actionlint queue-only ignore, bounded lychee rechecker and CodeQL JSON fixtures
remain necessary on the current upstream releases. No extraction, integrity,
path safety, status-code, retry-budget or publication acceptance assertion was
removed to bypass those limitations.

The three npm bootstrap steps carry a narrow `adhoc-packages` annotation: npm is
an exact-version package-manager executable whose release tarball bundles its
dependencies, unlike an unlocked application dependency installation. Lifecycle
scripts remain disabled. Application/tooling libraries continue to use committed
locks and `npm ci`; the annotation does not exempt any other package install.

Running the updated pre-commit hooks across the complete checkout exposed old
whitespace/EOF differences in captured case-study evidence and generated
CHANGELOG.md. Keep captured evidence and generated release history outside the
two rewriting formatters, matching the existing source-size guard's generated
history policy. All validation hooks (YAML/TOML/merge conflicts/large files,
Python debug statements, ShellCheck and Rust checks) remain active. Historical
captures and release history were restored instead of reformatted as source.
