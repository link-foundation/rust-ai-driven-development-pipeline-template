Confirmed a smaller reproducer on the current cargo-audit 0.23.0 Linux binary (2026-11-14):

```toml
version = 4
[[package]]
name = "audit-panic-repro"
version = "0.1.0"
dependencies = ["missing 1.0.0"]
```

Save as bad.lock and run `cargo audit --file bad.lock --deny warnings`. It exits 101 and panics at `cargo-audit/src/presenter.rs:160:14`: `invalid Cargo.lock dependency tree: Resolution("failed to find dependency: missing 1.0.0")`.

An inconsistent lockfile should fail, but with a normal diagnostic rather than a presenter panic. Our real failure also contained duplicate syn entries and a reference to an absent syn version. Local workaround: regenerate the lock with Cargo and run `cargo metadata --locked --format-version 1` before auditing. Suggested change: propagate dependency-tree resolution errors from the presenter instead of expecting success, and add the four-line fixture as a regression.

Consumer evidence and fixture: https://github.com/link-foundation/rust-ai-driven-development-pipeline-template/pull/248 .
