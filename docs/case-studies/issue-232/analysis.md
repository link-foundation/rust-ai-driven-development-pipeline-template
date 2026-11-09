# Issues 230–232: concurrency and validated release source

## Scope and requirement inventory

Issue 232 requires one PR implementing both native sub-issues, reading all issue
and PR feedback, and separate closing references for 230, 231 and 232. All three
issues and the PR conversation, inline comments and reviews were read; none had
comments at the initial audit. Both defects reproduce in the prepared revision.

| Requirement | Solution and verification plan |
| --- | --- |
| 230: cancel obsolete checks on PRs and main | Literal true cancellation for every affected read-only job in every workflow, including reusable JavaScript prerequisites and desktop builds; evaluate the actual workflow policy for both refs. |
| 230: isolate matrix lanes | Preserve OS, architecture and label dimensions in existing groups; assert independent groups in regression tests. |
| 230: preserve active writer serialization | Preserve shared `main-writer-${{ github.repository }}`, false cancellation and `queue: max` for all existing repository/registry/deployment writers; no workflow-level cancellation. |
| 230: cancellation-aware terminal gate | Exercise the real status gate against actual workflow jobs: superseded checks pass, current cancellations and cancelled writers fail. Preserve existing fail-closed evidence checks. |
| 231: preserve tested source/dependencies | Record the initial validated HEAD; inspect remote trees before initial synchronization and every push retry. Reject source, dependency, configuration, mode and unexpected metadata changes with an actionable error. |
| 231: permit equivalent release metadata | Explicit path allowlist, parsed TOML/JSON equivalence after normalizing only local package version fields; permit changelog updates and consumed fragments. External lock entries, scripts, dependency constraints and all other manifest fields remain compared. |
| 231: guard every race | Fetch once, resolve an immutable remote SHA, validate it, then rebase onto that exact SHA. Validate the resulting tree against the original source too; never fetch implicitly through pull. |
| 231: retain failure classification and tag order | Preserve repository rule/auth/other failure classification and create/push only the selected tag after successful branch push. Update ordering assertions to the guarded retry. |
| 231: executable regression | Local bare origin plus two clones; run the actual helper with a mocked registry, including initial source/dependency rejection, pre-push source races, permitted metadata races, and no published release/tag on refusal. |
| 232: complete in one PR | PR 233 closes each issue separately and records reproduction, checks and any remaining limits. |

## Root causes and alternatives

The main exception in job cancellation policy leaves redundant read-only work
running. Workflow-level cancellation would also interrupt active writers, so job
concurrency is the appropriate existing GitHub component. Existing writer queuing
already supplies serialization and is retained.

The release helper checks only whether remote commits exist, then unconditionally
rebases; its second path uses `pull --rebase`, allowing another implicit fetch.
ReleaseIndex protects uncommitted writes but cannot validate committed incoming
source. Rejecting every remote advancement is safe but unnecessarily prevents
independent language releases. Comparing filenames alone is unsafe because
manifests and locks contain dependencies and executable scripts. Use parsed
manifest/lock equivalence with a narrow metadata allowlist instead. Unknown
formats fail closed; no new release framework is needed.

The root JavaScript detector reports `required: false`: scripts and independent
examples are tooling, not a production counterpart. This is a Rust-only template;
no application port is required for these fixes.

## Primary-source research and existing components

- [GitHub concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency): job-level cancellation and non-cancelling groups fit the split between checks and writers.
- [GitHub queue announcement](https://github.blog/changelog/2026-05-07-github-actions-concurrency-groups-now-allow-larger-queues/): `queue: max` retains pending writers and requires false cancellation.
- [Git diff](https://git-scm.com/docs/git-diff) and [Git rebase](https://git-scm.com/docs/git-rebase): compare explicit revisions and rebase only onto the inspected immutable commit.
- [toml crate](https://docs.rs/toml/0.8/toml/): parsed TOML values avoid text/regex normalization of dependency-bearing documents. Existing serde_json handles npm metadata.
- [CI/CD principles](https://github.com/link-assistant/hive-mind/blob/main/docs/CI-CD-BEST-PRACTICES.md#10-concurrency-control), [related PR 341](https://github.com/link-assistant/agent/pull/341), and its linked finite Git probe explain the cross-template findings. Adopt the invariants while using this repository's own helper/test structure.

No screenshots are present in the required issues or PR feedback; these changes
have no visual UI surface. Release versions remain pipeline-managed; a patch
fragment is the repository's release trigger.
