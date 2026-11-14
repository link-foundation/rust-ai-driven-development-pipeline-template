# Issue 247 / PR 248 execution plan

Objective: implement and verify all requirements in one unmerged PR. Only the
coordinator pushes `issue-247-606302267166`, once per complete verified batch.

## Requirements and proposed solutions

| ID | Requirement | Solution and verification |
| --- | --- | --- |
| R1 | Read issue, all comments, required sub-issues, PR conversation, inline comments and reviews | Preserve API snapshots here; no required sub-issues or review comments in the initial snapshot. Recheck before finishing. |
| R2 | Diagnose every failure introduced by merged PRs 241–246 without reverting updates | Preserve main run/job metadata and complete logs; reproduce duplicate lock packages, action-hash regression and CodeQL extraction errors; add regression coverage and preserve security assertions. |
| R3 | Update Rust first, including both manifests, lockfiles, transitive dependencies, scripts, tools, edition and MSRV | Query crates.io for every direct/locked package; migrate inline script dependencies; regenerate both locks with Cargo; test/build/lint on current stable with one compiler process. |
| R4 | Inspect Python and shell dependencies, add missing manifests when appropriate | Inventory imports and tool installation commands; scripts use the standard library, while workflow Python tools need a tracked requirements file, audit and updater coverage. |
| R5 | Update all JavaScript dependencies, including both tooling packages and transitive locks | Query npm latest, update manifests and regenerate locks, run all native tests and npm audits. Dependency-free example needs no invented dependency. |
| R6 | Update every remote action, reusable workflow and composite action | Query GitHub releases/default-branch commits; consistently update every live reference; read major migration notes; run workflow lint/security checks in CI. |
| R7 | Update every Docker base tag and digest | Resolve current stable Rust image from the registry, preserve immutable digest and validate container in CI. |
| R8 | Update infrastructure/pre-commit hooks and language runtimes | Query hook releases, PyPI and runtime release feeds; update all active pins consistently, documenting compatibility constraints. |
| R9 | Produce before/latest/resolved tables for every dependency and explain every retained old release | Preserve registry metadata and generate tables including transitive lock entries; distinguish compatible transitive constraints from direct pins. |
| R10 | Read changelog/migration guide for every major and use upstream features to delete duplicated logic | Research ureq 3, toml 1, getrandom and hook changes; preserve refusal/retry/timeout acceptance behavior while replacing obsolete API glue. |
| R11 | Honest floors, no stale upper bounds, consistent pins, all lockfiles committed | Set current direct version floors, one version per shared script dependency and runtime; validate fresh locked installation. |
| R12 | Keep all dependency ecosystems current automatically | Extend Dependabot and its offline coverage checker for Python and pre-commit; include only surfaces with dependencies. Root and example dependency-free manifests remain valid. |
| R13 | Full build/test/lint per ecosystem, zero new deprecations, zero unresolved advisories | Focused local checks plus same-candidate full CI; audit npm locks, Rust locks and Python tool environment; download all failed same-revision logs before another batch. |
| R14 | Search/report dependency bugs, missing features and reusable workarounds upstream with reproduction, versions, workaround and suggested fix | Inventory existing workaround reports, search upstream first, create/update reproducible reports as needed, link from PR. Keep necessary adapters. |
| R15 | Collect issue data, deep online analysis, possible solutions, existing components in this folder | Preserve issue/review/run/registry data and write research and verification reports with primary-source links. |
| R16 | Apply across entire codebase, preserve features and acceptance assertions | Search live code/config/scripts/examples; historical case-study evidence is immutable context, not an active dependency. Review the whole final diff. |
| R17 | JavaScript-first gate and bounded resources | Root has no production JS counterpart; tooling/examples do not require porting. Example native tests, inventory and regeneration run before example Rust. Keep strict readiness, provenance and security gates. |
| R18 | Release preparation and final PR hygiene | Add versioned changelog fragment (release pipeline owns package versions), merge current main into branch if necessary, clean tree, update title/body with Fixes #247, ready only after verification. No merge/release/deploy authorized. |
| R19 | Default-branch CI green | Verify PR changes fix main failures via fresh-merge CI. Actual post-merge main runs require separate merge authorization; report that boundary honestly. |

## Work sequence

1. Research: snapshots, main failures, dependency inventory, upstream release notes.
2. Draft all ecosystem updates and regressions in one batch; record migration choices.
3. Native JavaScript checks, then bounded focused Rust/Python/tool checks and audits.
4. Commit atomic steps, review complete diff, run required checks on candidate, push once.
5. Wait for all candidate CI; collect every failure and fix in a complete next batch.
6. Recheck issue/reviews/default-branch ancestry, finalize PR description and readiness.

## Initial evidence

- Main candidate: `7b819f8a40b9a2261792aabed7d055d146d8fe1e`.
- Pipeline run 43556886816: log lines 3447–3450 report duplicate `syn` lock entries;
  line 6215 reports the stale crates-io-auth-action hash assertion.
- Security run 43556886733: lines 934–935 report invalid Cargo.lock dependency tree;
  lines 4644–4646 report extraction warnings for `serde_json::json!` fixtures.
- Initial issue comment confirms these two main workflows failed after all runs
  finished; initial PR has no conversation comments, inline comments or reviews.

Status: research and implementation in progress; no acceptance criterion is
claimed complete solely because an upstream report or passing subset exists.
