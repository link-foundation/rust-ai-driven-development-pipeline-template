# Verification and requirement evidence

Prepared baseline: b6ede785b088becebb16be324866a541d61ee7cb, incorporating main
7b819f8a40b9a2261792aabed7d055d146d8fe1e. All local Rust builds use one compiler
process and shared compatible caches, debug info disabled, within the 2.92 GiB
container memory limit. No user-owned cache or dependency directory was deleted.

## Reproductions and fixes

- R2/R3: `cargo metadata --locked --format-version 1` rejects the original root
  Cargo.lock with duplicate syn packages. `experiments/issue-247-regressions.py`
  exercises Cargo's actual parser on that duplicate shape and checks both fixed
  manifests resolve without rewriting either committed lock. Original parser
  diagnostic: baseline-metadata-error.txt; original lock: Cargo.lock.before.txt.
- R2/R14: current cargo-audit 0.23.0 panics on the four-line missing-package
  fixture `experiments/issue-247-invalid-lock.txt`. See compressed
  audit-minimal-repro.log.gz. A normal Cargo graph validation now precedes audit;
  invalid graphs still fail and warnings remain denied.
- R2/R16: stale action hash/version assertions fail before adaptation; immutable
  revision, OIDC scope, ordering, secret selection and all scanner gates remain
  asserted. Baseline action/script logs preserve the failures.
- R2/R14: main Security log lines 4644–4646 identify three CodeQL JSON fixture
  macro extraction errors. Parsed JSON fixtures preserve exactly the original
  data and assertions; SARIF extraction warnings still fail the security job.
- R10/R16: existing sixteen release-sync tests exercise valid TOML manifests,
  competing writers, actual local Git pushes and registry mocks. They reproduce
  the TOML 1 document/value parser distinction and pass with `toml::from_str`.
- R10/R17: Node fixtures clear inherited NODE_TEST_CONTEXT and assert all eight
  native tests execute. Missing/partial/carried/unsupported ports, native failure,
  skipped tests, translation drift and wrong revisions continue to fail closed.
- R10/R14: `node --test experiments/issue-247-buildx.test.mjs` checks the real
  composite YAML and shell notice with mocked official-action outcomes. Canonical
  success, independent mirror recovery, both failures and disabled mirrors are
  covered. Upstream now owns pull retries instead of a duplicated local loop.

## Validation commands

The complete draft has passed the following local checks; final candidate checks
are repeated after committing, and the exact pushed SHA is verified in GitHub CI.
Authoritative final workflow status is attached to PR 248, rather than inferred
from a successful run on a different revision.

| Scope | Checks and evidence |
| --- | --- |
| Native JavaScript first | Example's eight native tests, strict parity inventory, deterministic regenerate-and-diff; policy checker and tests; all gate/readiness regressions. `final-native.log` |
| Root Rust | `cargo fmt --all --check`, Cargo warning gate, full locked build, docs with warnings denied, Clippy all targets/features with warnings denied, all-feature tests (296 integration tests plus lib/bin/doc targets). `rust-full-validation.log`, `final-full-validation.log` |
| Rust scripts and integration framework | Complete `scripts/test-scripts.sh`: every inline Rust harness, offline Git/registry/link/artifact regressions and all Node tests. No assertion or suite skipped. `script-tests.log`, `final-full-validation.log` |
| Independent example | Native prerequisites first; Rust fmt/test/build/Clippy/package, including compile-fail doctests. `final-full-validation.log`; container build remains on CI |
| JavaScript dependencies | Fresh `npm ci` for both locks using Node 26.13.1/npm 12.2.2, complete Node tests, both lockfile npm audits: zero advisories. `npm-full-validation.log`, policy-audit.json, secretlint-audit.json |
| Python | Python 3.15.2 installs all universal hashed requirements; pyflakes checks every tracked Python file, all Python regressions run in script suite, strict pip-audit reports zero vulnerabilities. `python-full-validation.log`, `final-lints-audit.log`, python-audit.json |
| Rust advisories | cargo-audit 0.23.0 with warnings denied: root and example locks, plus resolved version-and-commit/create-github-release/create-changelog-fragment script projects covering the inline dependency union. All report zero vulnerabilities and warnings; `*-audit.json` |
| Workflows and shell | actionlint 1.7.12, ShellCheck every tracked shell script, zizmor 1.32 regular plus high-severity/high-confidence pedantic pass, workflow-tool installation guard. `final-lints-audit.log`, `final-full-validation.log` |
| Repository hygiene | Full tracked secret scan, including bounded gzip evidence decompression; pre-commit hooks; source/doc size guard; full diff and branch ancestry review |

## Requirement mapping

R1: issue/review/sub-issue snapshots and final recheck. R2: baseline CI metadata,
logs and regressions above. R3–R8/R11: all manifest, lock, runtime and tool changes
and both version comparison reports. R9: live registry data and parent-constraint
tables. R10: research migration guides and removed duplication. R12: Dependabot
coverage checker and positive/missing/ghost-surface tests. R13: complete local
checks/audits plus exact candidate CI. R14: seven linked upstream reports. R15:
this evidence directory. R16: full source/config/example search and diff review.
R17: preserved automatic JS detection/readiness/provenance gates; root is Rust-only
and tooling does not invent an application port. R18: changelog release trigger,
clean candidate, current-main ancestry, PR title/body/readiness after passing CI.

R19 has a separate authorization boundary: fresh-merge CI can verify that this PR
repairs main's failures, but a new green main run after merging requires a merge.
Merging, releasing and deployment were expressly excluded from push authorization.
The PR remains unmerged; actual post-merge main verification cannot be represented
as completed by this run.
