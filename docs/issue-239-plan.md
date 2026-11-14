# Issue 239: dependency update coverage

The stale example image was unreported because no Dependabot configuration or
coverage check existed. Issue 239 has no comments or required sub-issues; PR 240
has no conversation comments, inline feedback or reviews at implementation time.

## Requirements and verification

- Update the example's Rust tag and digest together. Resolve the published
  `rust:1.100.0-slim` multi-platform index with `docker buildx imagetools inspect`;
  let the existing example workflow test native JavaScript, strict parity,
  regeneration, Rust packaging and the container on the candidate revision.
- Configure Docker for `/examples/javascript-first`, GitHub Actions at `/`,
  Cargo for the root's registry dependencies, and npm for locked CI tooling.
  Match the sibling templates' weekly schedule and seven-day cooldown.
- Check every tracked Dockerfile's registry `FROM` against its own directory's
  Docker update entry. Exercise additional Dockerfiles, multi-stage builds,
  scratch, platform options and argument-based image references in regressions.
- Require coverage for populated dependency ecosystems and reject empty update
  entries. Dependency-free example manifests must not create empty update jobs.
  Use parsed YAML, JSON and TOML rather than formatting-dependent config matches.
- Run the coverage regression and repository check on every CI/CD run in the
  existing Node-enabled secrets job, which feeds the workflow status gate.
- Add a patch changelog fragment as the release trigger; leave package versions
  to the existing release writer, as CONTRIBUTING.md requires.

## Workflow and assumptions

The selected root has no production JavaScript counterpart: tracked JavaScript
is CI tooling or the independent example. No application port or native adapter
is introduced. Existing example inventory and acceptance assertions are preserved.
Dependabot, rather than a second network freshness gate, reports new releases;
the offline coverage test ensures future dependency surfaces cannot be omitted.
The coverage policy supports the four ecosystems present here. New ecosystems
must extend detection and its regressions before adding their update entries.
It uses exact update directories and refuses exclusions or disabled updates;
glob directory matching and dependency filters require explicit tested support.
ARG-based base images conservatively require Docker coverage. Scratch and prior
stage aliases do not. Parsed Cargo registry/Git dependencies and npm dependency
groups establish populated manifests; local-only Cargo path dependencies do not.
No native ports, translations or handwritten adapters are incomplete.

The seven-day cooldown and directory settings follow the
[GitHub options reference](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference)
and the Python and C++ templates' existing configuration. Research also reviewed
the latest merged PR 238 and hive-mind's `dependency-freshness-2264.test.mjs`.

Draft all changes before verification. Run lightweight policy, JavaScript and
workflow checks locally for the committed candidate. Review the entire diff,
push one batch to the prepared branch, collect all same-revision CI failures,
then address any failures together. Preserve logs in ignored `ci-logs/`, include
current main, update PR 240 and mark it ready only after required checks pass.
Do not merge or publish. Use CI for full Rust builds within the container budget.
