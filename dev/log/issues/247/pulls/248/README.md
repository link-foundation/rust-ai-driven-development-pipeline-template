# Issue 247 / pull request 248 evidence

This directory records the repository-wide dependency update investigation for
[issue 247](https://github.com/link-foundation/rust-ai-driven-development-pipeline-template/issues/247)
and [PR 248](https://github.com/link-foundation/rust-ai-driven-development-pipeline-template/pull/248).

- [Requirements and solution plan](plan.md): all nineteen requirements, implementation choices and verification obligations.
- [Research](research.md): root causes, major migration guides, alternatives and upstream reports.
- [Complete package/action comparison](dependency-versions.md): before, live latest, resolved after and every retained transitive constraint.
- [Runtime, tool, hook and container comparison](runtime-and-images.md).
- [Verification](verification.md): reproduction commands, complete validation and remaining CI/authorization boundaries.
- `issue*.json`, `pr-*.json`, `sub-issues.json`: complete issue/comments/reviews; no required sub-issues were present.
- `main-*.json`, `branch-*.json`, `branch-failures.txt`: run timestamps, exact SHAs and original failure locations.
- `registry-latest.json`, `dependencies-{before,after}.json`, `cargo-parent-requirements.json`: machine-readable live registry and resolver evidence.
- `upstream-reports/`: searched existing reports, minimal reproductions, submitted bodies and permanent posted-comment URLs.
- `evidence/*.log.gz`: original CI and local reproduction/validation logs, gzip-compressed with deterministic timestamps. Read with `gzip -dc`; decompression is bounded by the repository secret scanner.

Raw working logs are also retained locally as ignored `*.log` and `ci-logs/`
files. Published upstream source snapshots use `.txt` where their original
relative documentation links would otherwise be interpreted against this repo.
`dependency-update-best-practices.txt` is the unmodified referenced guidance;
`ureq-migration.md` and the `*-changelog.txt` files preserve major migration research.
The inventory and report generators live in `experiments/issue-247-*.py` and do
not modify dependency caches or compile source.
