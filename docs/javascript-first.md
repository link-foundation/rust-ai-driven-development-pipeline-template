# JavaScript first and the single push gate

For mixed Rust/JavaScript projects, implement and debug complete behavior in native
JavaScript before compiling Rust. A browser UI, WASM wrapper, source envelope,
matching filename set or equal test count does not establish behavioral parity.

Maintain a feature inventory covering public APIs, CLI commands, errors, streams,
persistence and deployment contracts. Record missing, partial and carried items;
the production Rust gate must reject each. Use shared input/output fixtures and
independent native execution, including refusal and boundary cases.

Pin translation source and dependencies by immutable revision. Preserve typed meta IR (including Links
Notation) intermediates, source hashes, target artifacts and refusal reasons.
Regenerate into temporary output and compare tracked targets before Rust builds.
A successful source round trip establishes preservation of source text; execution
parity still requires observations from both native runtimes. Handwritten native
adapters must be explicit inventory entries with their own tests.

Use `.github/workflows/javascript-first-gate.yml` as a callable workflow. Supply
real repository commands for the native JavaScript suite, strict readiness/parity
inventory check and regenerate-and-diff check. The template deliberately supplies
no default generator or placeholder successful command. Depend on its successful
job with `needs:` before every Rust test/build/package/container/publish job;
consume its `tested-sha` output as the checkout ref. A skipped gate is not success.
For projects whose JavaScript port is unfinished, keep the readiness gate red and
report the blockers rather than representing the rollout as complete. Adoption of
this opt-in workflow does not by itself migrate this template's Rust-only sample.

Avoid `workflow_run` when same-workflow `needs:` or reusable workflows suffice.
If a separate workflow is required, check the source conclusion, repository/event
trust, exact `head_sha` and artifact provenance; default `GITHUB_SHA` refers to the
default branch rather than the initiating run. Keep untrusted PR execution read-only.

Read-only CI checks may run in parallel after the JavaScript prerequisite. Give
active releases, deploys, tag writes and generated-content pushes one shared
repository writer group with `cancel-in-progress: false`; check cancellation must
not interrupt publication. Reconcile current remote state before each write.

Draft changes in bulk. Workers may inspect, edit and run bounded JavaScript checks,
but exactly one coordinator owns git push. That coordinator stages a complete
batch, verifies the exact candidate revision with required local checks, inspects
the diff and pushes once. Wait for required same-revision CI before another push;
combine all observed failures into the next batch. Push permission does not imply
permission to merge, publish, deploy or clean user-owned caches.

Bound expensive local work: avoid duplicate profile/target/feature configurations,
share compatible build caches, limit compiler processes, measure wall time and disk,
and stop when the agreed budget is exhausted. Never silently reduce production
assertions, treat partial runs as green, or delete unrelated caches to regain space.

References: [router issue 759](https://github.com/link-assistant/router/issues/759),
[GitHub needs semantics](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#jobsjob_idneeds),
[GitHub workflow_run](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_run),
[Cargo build cache](https://doc.rust-lang.org/cargo/reference/build-cache.html).
