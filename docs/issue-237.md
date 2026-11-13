# Issue 237: requirements, research and verification plan

Scope: [237](https://github.com/link-foundation/rust-ai-driven-development-pipeline-template/issues/237)
and its complete native sub-issue list: 234, 235, 236. All issue descriptions,
comments (including 235's downstream confirmation), PR 238 conversation, inline
comments and reviews were read. There were no additional PR comments or reviews
at initial inspection. No requirement was already resolved at the starting tree.

| Requirement | Options considered and selected implementation | Regression evidence |
| --- | --- | --- |
| 234: quiet ShellCheck without losing the pinned version | Use the runner binary, suppress pipx warnings, or invoke the pinned package in a venv. Select the venv so the exact version stays explicit and warnings remain visible. | `scripts/issue-237.test.mjs`; ShellCheck CI executes the venv binary over all tracked shell files. |
| 235: earlier PR code survives a docs-only final commit and superseded CI | Diff the complete synthetic merge against its base, or query prior successful workflow runs before permitting a smaller diff. Select the complete PR diff: deterministic, offline, no API authorization or stale success lookup. | `pull_request_synthetic_merge_checks_code_before_docs_only_followup` builds a two-commit PR. Existing push, empty diff, deletion/rename and monorepo tests remain. |
| 236.1: handle both Errors and Timeouts sections in both consumers | Extend the existing shared markdown parser, or switch the entire action and its reports to JSON. Select the shared parser to preserve current reports, legacy fixtures and archive behavior. Count both summary rows and refuse incomplete reports. | `scripts/issue-237.test.mjs` checks mixed and timeout-only reports, both consumers, omitted entries and a recovered 503 beside an unrecovered timeout. |
| 236.1: only exit 2 may recover; weekly link rot checks | Fail closed on runtime/configuration errors in the helper and workflow; add Monday 05:41 UTC cron. Increasing network timeouts cannot fix an ignored section or checker crash. | Exit 1, 3, unknown and empty statuses are refused; workflow condition and schedule assertions. |
| 236.3: safe and exhaustive CodeQL logs | JSON-quote every untrusted field, including paths, messages, levels, IDs and line values. Aggregate malformed reports/runs/items, diagnostics and findings before failing. Stopping workflow command parsing globally was considered but quoting is simpler and local. | `scripts/check-codeql-results.test.mjs` exercises malformed JSON, malformed arrays/items, unsuccessful invocation, diagnostics and later findings together, plus CR/LF workflow-command payloads. |
| 236.4: PRs cannot evict main caches by saving new entries | Split restores and successful main-push-only saves in every active workflow. Use restore primary keys for saves; preserve Windows/Unix conditions. PR-only fresh-merge restores compatible lint cache and never saves. Guard both Docker exporters. Lychee key depends on inputs instead of run ID. | Repository-wide workflow assertions in `scripts/issue-237.test.mjs`; actionlint and zizmor CI. |
| 236.5: JavaScript helpers get 900/1000 source limits | Extend the existing file checker to `.mjs` and `.js`; keep documentation's existing 2250/2500 limits and all exclusions. A separate JS checker would duplicate traversal and policy. | `javascript_uses_source_warning_and_hard_limits` checks both extensions at 900, 901 and 1001 lines using real files. |
| 236.10: concurrent sibling releases must not lose the Rust release | Scope the existing tree guard to an independent Rust root while preserving root files/shared CI. Allow deletion of existing `.changeset/*.md` fragments. Alternative workflow redispatch requires extra permissions and changes release scheduling. | `experiments/issue-231-release-sync.py` releases Rust after concurrent JS, Python and C# metadata writes, both before synchronization and during an actual push race. Negative cases preserve source, dependency, shared-tooling and fragment-edit refusals. |
| 237: one PR, no deferred sub-issues, one closing keyword per issue | Implement all requirements in PR 238 and retain separate `Fixes` references for 237, 234, 235 and 236. | PR body and whole-diff review; exact-revision CI before marking ready. |

The issue's “Checked and not affected” list is context, not a request to change
secrets scanning, reruns or release-preflight gating. Historical case-study
snapshots are evidence, not active workflows, and remain preserved.

## Primary sources and existing components

- [Downstream PR 174](https://github.com/link-foundation/link-cli/pull/174)
  contains related implementations. Its CodeQL helper still stops early for some
  malformed structures, so this change extends aggregation instead of copying it
  unchanged. The complete PR diff approach is also described in issue 235's
  downstream comment; the prior-success API optimization is unnecessary here.
- [lychee README](https://github.com/lycheeverse/lychee#exit-codes) defines
  0 as success, 2 as failed links, and 1/3 as checker/configuration failures.
  Its [markdown writer](https://github.com/lycheeverse/lychee/blob/master/lychee-bin/src/formatters/stats/markdown.rs)
  emits separate Errors and Timeouts summary rows and sections. The existing
  shared parser can cover these without adding a dependency.
- [actions/cache](https://github.com/actions/cache) provides separate restore
  and save actions and a `cache-primary-key` output. GitHub's
  [cache scope documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching)
  explains why PR merge-ref entries cannot warm main.
- [Python venv](https://docs.python.org/3/library/venv.html) supplies an isolated
  binary path; [shellcheck-py](https://github.com/shellcheck-py/shellcheck-py)
  already provides the pinned ShellCheck distribution. No new installer needed.
- [GitHub workflow commands](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands)
  use the `::command::` log syntax. JSON string escaping keeps code-controlled
  values on a single physical line without suppressing legitimate diagnostics.
- Existing `toml`, `serde_json`, native Node test runner, local Git fixtures and
  Python mock-registry integration framework are sufficient. XML/Python release
  manifest parsing libraries are unnecessary when independent sibling trees can
  be excluded from Rust source validation.

## Scope and safety assumptions

Automatic JavaScript detection reports `required: false` at the repository root:
its JavaScript consists of tooling and an independent example, not a counterpart
to the Rust sample. No native port or adapter was added. The existing strict gate
and all acceptance assertions remain in place.

A nested Rust root can treat unrelated sibling directories as independent only
when neither committed tree has a parent Cargo workspace, Rust symlinks, or
Cargo paths reaching outside that root. Root files, hidden/shared directories,
scripts, tests, fixtures, docs and Rust's own paths remain protected. Existing
regular Changeset fragments may be consumed; edits/additions and README deletion
remain refused. Repository-root Rust projects retain whole-tree validation.
Sibling source changes are ignored only under that independent-root contract;
projects with other shared build inputs should place them in protected shared
paths or use a repository-root validation scope.

## Verification sequence

1. Native JS regressions and automatic counterpart detection before Rust builds.
2. Script tests with `CARGO_BUILD_JOBS=1`, shared compatible rust-script caches and
   debug information disabled; actual Git/registry mock integration regressions.
3. Formatting, Cargo manifest warnings, workflow tool availability, file sizes,
   focused crate CI-policy tests and whole-diff review.
4. Commit the complete batch, verify that exact candidate, push once, collect all
   same-revision workflow failures/logs before preparing another batch.
5. Update PR 238 title/body, preserve all four closing references, confirm main
   ancestry, clean working tree and passing checks, then mark ready. No merge,
   publication or deployment is authorized by this task.
