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

## Executable example and adoption

`examples/javascript-first/` is a small, independent checked-i32-addition API.
It includes native JavaScript, shared success/refusal/boundary fixtures, a typed
JSON IR, a deterministic dependency-free translator and a strict inventory.
SHA-256 hashes pin the native source, IR, fixtures and translator in `parity.json`.
The translator refuses unsupported IR and unpinned inputs. The inventory names
Rust's i32 input adapter explicitly; native invalid-input fixtures exercise that
refusal while Rust tests observe the representable inputs and overflow cases.
Compile-fail doctests also verify Rust rejects fractional and out-of-range input.
This inventory covers this example's API only. Extend the inventory and fixtures
to every feature of your actual application before adopting it for production.

Run the prerequisite checks without installing Rust:

```sh
node --test examples/javascript-first/native.test.mjs scripts/javascript-first.test.mjs
node examples/javascript-first/check-parity.mjs
node examples/javascript-first/generate.mjs --check
```

The example caller is `.github/workflows/javascript-first-example.yml`. It runs
these real commands through the reusable gate. Only success schedules the Rust
job (tests, build, packaging and publish dry run) and the container build. Both
check out `tested-sha`. The failure tests cover native failure/skip exit, absent
commands, missing/partial/carried inventory entries, stale source hashes,
generated drift and a mismatched revision, and check every downstream dependency.
A workflow-level skipped gate also prevents those jobs through their explicit
`needs` and success condition. No toolchain is installed in the prerequisite.

For a release that generates a new candidate commit, pass its full SHA using the
example dispatch's `candidate-sha` input. Validate that candidate through this
same gate before any compilation, package, container or publishing operation.
Actual publishing remains a separately authorized writer operation, serialized
with other writers and bound to that tested candidate. The example only performs
`cargo publish --dry-run`; it does not publish its demonstration package.

When changing behavior, update native tests first, then native implementation,
fixtures and IR. Review any newly required adapter or refusal. Update the pinned
hashes only for reviewed source/translator changes, run the generator, and commit
its output with the inventory. The gate requires a clean worktree after checking;
commands must generate temporary artifacts outside tracked source or in ignored
build directories. A caller cannot substitute a source round trip or placeholder
command for executable native checks and complete feature parity.
