# CI/CD Comparison Report: Template vs Reference Repositories

## Repositories Compared

| Repository | Type | Workflow Files | Script Language |
|---|---|---|---|
| **Template** (rust-ai-driven-development-pipeline-template) | Single-language Rust | `release.yml` | Rust (rust-script) |
| **browser-commander** | Multi-language (JS/Python/Rust) | `js.yml`, `python.yml`, `rust.yml` | JavaScript (Node.js .mjs) |
| **lino-arguments** | Multi-language (JS/Rust) | `js.yml`, `rust.yml` | JavaScript (Node.js .mjs) |
| **trees-rs** | Single-language Rust | `ci.yml` | Rust (rust-script) |
| **Numbers** | Multi-language (C#/C++/Rust) | `rust.yml`, `csharp.yml`, `cpp-test.yml`, `deploy-cpp.yml`, `AutoMerge.yml` | Mixed (Rust + JS) |

---

## 1. Action Version Differences

### trees-rs uses newer action versions

| Action | Template | trees-rs | browser-commander / lino-arguments |
|---|---|---|---|
| `actions/checkout` | **v4** | **v6** | v4 |
| `actions/cache` | **v4** | **v5** | v4 |
| `peter-evans/create-pull-request` | **v7** | **v8** | v7 |

**Finding**: trees-rs has upgraded to `actions/checkout@v6`, `actions/cache@v5`, and `peter-evans/create-pull-request@v8`. The template still uses v4/v4/v7 respectively.

**Recommendation**: Update template to use latest action versions (v6, v5, v8).

---

## 2. Path Filtering on push/pull_request Triggers

### Template (MISSING)
The template triggers on ALL pushes to main and ALL pull requests with no path filtering:
```yaml
on:
  push:
    branches:
      - main
  pull_request:
    types: [opened, synchronize, reopened]
```

### Reference repos (browser-commander, lino-arguments, Numbers)
All multi-language repos use `paths:` filtering:
```yaml
on:
  push:
    branches:
      - main
    paths:
      - 'rust/**'
      - 'scripts/**'
      - '.github/workflows/rust.yml'
  pull_request:
    paths:
      - 'rust/**'
      - 'scripts/**'
      - '.github/workflows/rust.yml'
```

Numbers also includes `changelog.d/**` in its path filters.

**Finding**: Path filtering is critical for multi-language repos to avoid unnecessary CI runs. Even for single-language repos, the template could benefit from path filtering to skip CI on docs-only changes (which detect-changes already handles at the job level, but path filtering avoids even starting the workflow).

**Recommendation**: Consider adding optional path filtering guidance or making it configurable for multi-language mode.

---

## 3. Concurrency Group Prefix for Multi-Language Repos

### Template
```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
```

### browser-commander (Rust workflow)
```yaml
concurrency:
  group: rust-${{ github.workflow }}-${{ github.ref }}
```

### browser-commander (Python workflow)
```yaml
concurrency:
  group: python-${{ github.workflow }}-${{ github.ref }}
```

**Finding**: Multi-language repos prefix the concurrency group with the language name to prevent different language workflows from canceling each other.

**Recommendation**: Document this as a best practice for multi-language mode. The template uses the workflow name which is sufficient for single-language repos.

---

## 4. `defaults.run.working-directory` for Multi-Language Repos

### Template (MISSING)
No `defaults` block. All scripts run from repository root.

### All multi-language reference repos
```yaml
defaults:
  run:
    working-directory: rust
```

With explicit `working-directory: .` overrides for scripts that need to run from root.

**Finding**: The template does not include `defaults.run.working-directory`. This is correct for single-language repos but the pattern should be documented for multi-language support.

---

## 5. Release Tag Prefix Support (`--tag-prefix` and `--release-label`)

### Template
The template's `version-and-commit.rs` supports `--tag-prefix` parameter, defaulting to `"v"`. However, the workflow YAML does not pass `--tag-prefix` or `--release-label` in any of its steps:
```yaml
run: rust-script scripts/version-and-commit.rs --bump-type "${{ steps.bump_type.outputs.bump_type }}"
```

### lino-arguments (multi-language)
```yaml
run: node scripts/version-and-commit.mjs \
  --bump-type "${{ steps.bump_type.outputs.bump_type }}" \
  --tag-prefix "rust_" \
  --release-label "Rust"
```

And for create-github-release:
```yaml
run: node scripts/create-github-release.mjs \
  --release-version "${{ steps.current_version.outputs.version }}" \
  --repository "${{ github.repository }}" \
  --tag-prefix "rust_" \
  --release-label "Rust"
```

**Finding**: Multi-language repos use `--tag-prefix "rust_"` (underscore, not "v") and `--release-label "Rust"` to disambiguate releases from different languages. The template scripts support this via CLI args but the workflow doesn't use it. For single-language repos, `v` prefix is correct. The `--release-label` parameter is supported in the JS scripts but **not implemented in the template's Rust scripts**.

**Recommendation**: Add `--release-label` support to the Rust scripts for multi-language compatibility.

---

## 6. `TAG_PREFIX` Environment Variable in check-release-needed

### Template
```yaml
- name: Check if version already released or no fragments
  id: check
  env:
    HAS_FRAGMENTS: ${{ steps.bump_type.outputs.has_fragments }}
  run: rust-script scripts/check-release-needed.rs
```

### lino-arguments
```yaml
- name: Check if version already released or no fragments
  id: check
  working-directory: .
  env:
    HAS_FRAGMENTS: ${{ steps.bump_type.outputs.has_fragments }}
    RUST_ROOT: rust
    TAG_PREFIX: rust_
  run: node scripts/check-release-needed.mjs
```

**Finding**: lino-arguments passes `TAG_PREFIX` environment variable to check-release-needed. The template does not use this.

---

## 7. Format GitHub Release Notes (Post-Release Formatting Step)

### Template (MISSING)
No post-release formatting step.

### lino-arguments
```yaml
- name: Format GitHub release notes
  if: steps.check.outputs.should_release == 'true'
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  working-directory: .
  run: node scripts/format-rust-release.mjs \
    --release-version "${{ steps.current_version.outputs.version }}" \
    --repository "${{ github.repository }}" \
    --tag-prefix "rust_"
```

### browser-commander (JS workflow)
```yaml
- name: Format GitHub release notes
  if: steps.publish.outputs.published == 'true'
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: node scripts/format-github-release.mjs \
    --release-version "${{ steps.publish.outputs.published_version }}" \
    --repository "${{ github.repository }}" \
    --commit-sha "${{ github.sha }}"
```

**Finding**: Both lino-arguments and browser-commander have a dedicated post-release step to format/enhance GitHub release notes after creation. The template has no equivalent step or script.

**Recommendation**: Add a `format-github-release.rs` or `format-rust-release.rs` script to enhance release notes after creation (e.g., add badges, format changelog entries, add commit links).

---

## 8. Code Coverage Job

### Template (MISSING)
No code coverage step.

### Numbers (Rust workflow)
```yaml
coverage:
  name: Code Coverage
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Setup Rust
      uses: dtolnay/rust-toolchain@stable
      with:
        components: llvm-tools-preview
    - name: Cache cargo registry
      uses: actions/cache@v4
      with:
        path: |
          ~/.cargo/registry
          ~/.cargo/git
          rust/target
        key: ${{ runner.os }}-cargo-coverage-${{ hashFiles('rust/Cargo.lock') }}
        restore-keys: |
          ${{ runner.os }}-cargo-coverage-
    - name: Install cargo-llvm-cov
      uses: taiki-e/install-action@cargo-llvm-cov
    - name: Generate code coverage
      run: cargo llvm-cov --all-features --lcov --output-path lcov.info
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v4
      with:
        files: rust/lcov.info
        fail_ci_if_error: false
```

**Finding**: Numbers has a full code coverage job using `cargo-llvm-cov` and Codecov integration. The template has no coverage support.

**Recommendation**: Add an optional code coverage job to the template.

---

## 9. Deploy Documentation Differences

### Template
```yaml
- name: Build documentation
  run: cargo doc --no-deps --all-features
- name: Deploy to GitHub Pages
  uses: peaceiris/actions-gh-pages@v4
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: target/doc
```

### trees-rs
```yaml
- name: Build documentation
  run: cargo doc --no-deps
- name: Deploy to GitHub Pages
  uses: peaceiris/actions-gh-pages@v4
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: rust/target/doc
    destination_dir: rust
    keep_files: true
```

**Differences**:
1. Template uses `--all-features` for doc generation; trees-rs does not
2. trees-rs uses `destination_dir: rust` and `keep_files: true` for multi-language doc coexistence
3. trees-rs publishes to a subdirectory to allow multiple languages to share GitHub Pages

**Finding**: The `destination_dir` and `keep_files` options are important for multi-language repos where each language publishes docs to its own subdirectory.

---

## 10. `cargo package --list --allow-dirty` vs `cargo package --list`

### Template
```yaml
- name: Check package
  run: cargo package --list
```

### lino-arguments
```yaml
- name: Check package
  run: cargo package --list --allow-dirty
```

**Finding**: lino-arguments uses `--allow-dirty` which is useful in CI environments where the working directory may have untracked files from previous steps. The template does not use this flag.

---

## 11. Version-and-Commit Script: Pre-release Support and Version Ceiling Check

### Template `version-and-commit.rs`
- Basic semver parsing (major.minor.patch only)
- Simple crates.io check for exact version
- No maximum published version query
- No auto-adjustment if computed version is <= published version

### trees-rs `version-and-commit.rs` (ENHANCED)
- **Pre-release version support**: Parses `0.1.0-beta.1` style versions
- **Maximum published version query**: Calls `get_max_published_version()` to find the highest non-yanked version on crates.io
- **Version ceiling check**: `ensure_version_exceeds_published()` ensures the new version is strictly greater than the max published version, with automatic patch increment if needed
- **Git tag collision avoidance**: Loops checking both tags and crates.io with safety counter (max 100 attempts)
- **Yanked version awareness**: Filters out yanked versions when determining the maximum

**Finding**: The trees-rs version-and-commit script is significantly more robust. It prevents the critical failure mode where a version bump produces a version that already exists on crates.io (e.g., if someone manually published a version).

**Recommendation**: Backport the `ensure_version_exceeds_published()` logic, pre-release support, and max-version checking from trees-rs into the template.

---

## 12. check-release-needed.rs: Max Published Version Output

### Template
- Checks if the exact current version is published on crates.io
- Does not output the max published version

### trees-rs (ENHANCED)
- Same check as template PLUS:
- Queries max published (non-yanked) version from crates.io
- Outputs `max_published_version` to GITHUB_OUTPUT for downstream steps
- Has full `CratesIoCrate` / `CratesIoVersionEntry` types for version listing

**Finding**: The trees-rs version outputs more data for downstream use, enabling smarter version bump decisions.

---

## 13. publish-crate.rs: "Already Exists" Handling

### Template
```rust
if combined.contains("already uploaded") || combined.contains("already exists") {
    println!("Version {} already exists on crates.io - this is OK", version);
    set_output("publish_result", "already_exists");
}
```
Returns success (exit 0) when version already exists.

### trees-rs (STRICTER)
```rust
if combined.contains("already uploaded") || combined.contains("already exists") {
    eprintln!("=== VERSION ALREADY PUBLISHED ===");
    eprintln!("The release pipeline must always publish a version greater than what is already published.");
    set_output("publish_result", "already_exists");
    exit(1);  // <-- FAILS instead of succeeding
}
```
Returns failure (exit 1) when version already exists.

**Finding**: trees-rs treats "version already exists" as an error (exit 1), enforcing that the pipeline must always produce a new version. The template treats it as OK (exit 0). The trees-rs approach is stricter and catches pipeline bugs earlier.

**Recommendation**: Consider making this behavior configurable or adopting the stricter approach.

---

## 14. create-github-release.rs: Auto-badges in Release Notes

### Template (HAS THIS)
```rust
// Add crates.io and docs.rs badges
if let Some(crate_name) = get_crate_name_from_toml(&cargo_toml) {
    let badges = format!(
        "[![Crates.io](...)](...) [![Docs.rs](...)](...)",
        crate_name, ...
    );
    release_notes = format!("{}\n\n{}", badges, release_notes);
}
```

### trees-rs (DOES NOT HAVE THIS)
No auto-badge logic in create-github-release.rs.

**Finding**: The template is actually MORE advanced than trees-rs in this regard. The template auto-adds crates.io and docs.rs badges to GitHub release notes.

---

## 15. create-github-release.rs: Error Handling for "Already Exists"

### Template
```rust
if stderr.contains("already exists") {
    println!("Release {} already exists, skipping", tag);
}
```

### trees-rs (MORE ROBUST)
```rust
let combined = format!("{}{}", stderr, stdout);
if combined.contains("already exists") || combined.contains("already_exists")
    || combined.contains("Validation Failed")
{
    println!("Release {} already exists, skipping", tag);
}
```

**Finding**: trees-rs checks both stderr and stdout, and also checks for "Validation Failed" (the actual GitHub API error message for duplicate releases). The template only checks stderr.

**Recommendation**: Update template to check combined stdout+stderr and include "Validation Failed" check.

---

## 16. Badge Patterns in README.md

### Template
```markdown
[![CI/CD Pipeline](https://github.com/link-foundation/rust-ai-driven-development-pipeline-template/workflows/CI%2FCD%20Pipeline/badge.svg)](...)
[![Crates.io](https://img.shields.io/crates/v/my-package?label=crates.io&style=flat)](...)
[![Docs.rs](https://docs.rs/my-package/badge.svg)](...)
[![Rust Version](https://img.shields.io/badge/rust-1.70%2B-blue.svg)](...)
[![License: Unlicense](https://img.shields.io/badge/license-Unlicense-blue.svg)](...)
```

### trees-rs
```markdown
[![Unlicense](https://img.shields.io/badge/license-Unlicense-blue.svg)](...)
[![Crates.io](https://img.shields.io/crates/v/platform-trees?label=crates.io&style=flat)](...)
[![CI/CD Pipeline](https://github.com/linksplatform/trees-rs/workflows/CI%2FCD%20Pipeline/badge.svg)](...)
[![Docs.rs](https://docs.rs/platform-trees/badge.svg)](...)
```

### Numbers (multi-language table format)
```markdown
| CI | Packages | Language |
| -- | -------- | -------- |
| [![CD](...)(...) | [![NuGet](...)(...) | [C#](csharp) |
| [![Rust](...)(...) | [![Crates.io](...)(...) | [Rust](rust) |
```

### browser-commander (per-language table)
```markdown
| Language | Package | Status |
| JavaScript | [...](npm) | [![npm](...)] |
| Rust | [...](crates.io) | [![crates.io](...)] |
| Python | [...](pypi) | [![PyPI](...)] |
```

### lino-arguments
```markdown
[![License: Unlicense](https://img.shields.io/badge/license-Unlicense-blue.svg)](...)
```
Per-language badges under language section headings.

**Findings**:
1. Template has `my-package` placeholder in badges (needs update guidance)
2. Numbers and browser-commander use table-based badge layouts for multi-language repos
3. Numbers uses Codacy and CodeFactor quality badges (not in template)
4. Numbers has GitHub Codespaces badge
5. trees-rs badge ordering: License first, then Crates.io, then CI, then Docs

**Recommendation**: Add guidance for multi-language badge table patterns. Consider adding code quality service badges as optional.

---

## 17. AutoMerge for Dependabot

### Template (MISSING)
No auto-merge workflow.

### Numbers
Has `AutoMerge.yml`:
```yaml
name: auto-merge
on:
  pull_request_target:
jobs:
  auto-merge:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: ahmadnassri/action-dependabot-auto-merge@v2
        with:
          target: minor
          github-token: ${{ secrets.DEPENDABOT_AUTO_MERGE_TOKEN }}
```

**Finding**: Numbers has an auto-merge workflow for Dependabot PRs (up to minor version bumps). Template does not have this.

**Recommendation**: Consider adding an optional Dependabot auto-merge workflow.

---

## 18. npm OIDC Trusted Publishing

### browser-commander / lino-arguments (JS workflows)
```yaml
permissions:
  contents: write
  pull-requests: write
  id-token: write  # Required for npm OIDC
```
With `setup-npm.mjs` to configure npm for OIDC-based publishing (no token needed).

**Finding**: JS workflows use OIDC trusted publishing for npm. The template's Rust workflow uses token-based auth for crates.io (which is the only option for crates.io currently). No action needed but worth noting the pattern.

---

## 19. Detect Changes Outputs: `rust-code-changed` and `rust-package-changed`

### Template
Outputs: `rs-changed`, `toml-changed`, `docs-changed`, `workflow-changed`, `any-code-changed`

### lino-arguments
Additional outputs: `mjs-changed`, `rust-workflow-changed`, `rust-code-changed`, `rust-package-changed`

### browser-commander
Additional outputs: `mjs-changed`, `rust-code-changed`

**Finding**: Multi-language repos distinguish between `any-code-changed` (any language) and `rust-code-changed` / `rust-package-changed` (just Rust). The changelog check in lino-arguments uses `rust-package-changed` to avoid requiring changelog fragments for non-Rust changes.

**Recommendation**: For multi-language support, add `rust-code-changed` and `rust-package-changed` outputs to detect-changes.

---

## 20. `RUST_ROOT` Environment Variable

### Template
Does not pass `RUST_ROOT` env var in workflow steps; relies on auto-detection in scripts.

### lino-arguments / Numbers
Explicitly passes `RUST_ROOT: rust` to many steps:
```yaml
env:
  RUST_ROOT: rust
run: node scripts/publish-crate.mjs
```

**Finding**: Multi-language repos explicitly set `RUST_ROOT` rather than relying on auto-detection. This is safer and more explicit.

---

## Summary of Missing Best Practices (Priority Order)

### High Priority (Bugs/Robustness)

1. **Version ceiling check**: trees-rs `ensure_version_exceeds_published()` prevents publishing versions that already exist. Template lacks this.
2. **Pre-release version support**: trees-rs handles `0.1.0-beta.1` versions; template only handles `major.minor.patch`.
3. **Release error handling**: trees-rs checks combined stdout+stderr and "Validation Failed" in create-github-release; template only checks stderr.
4. **Stricter publish-crate**: trees-rs fails (exit 1) on "already exists"; template silently succeeds.

### Medium Priority (Features)

5. **Format GitHub release notes step**: Both lino-arguments and browser-commander have post-release formatting scripts. Template lacks this.
6. **Code coverage job**: Numbers has cargo-llvm-cov + Codecov. Template has no coverage.
7. **Action version updates**: trees-rs uses checkout@v6, cache@v5, create-pull-request@v8.
8. **Max published version output**: trees-rs check-release-needed outputs `max_published_version` for downstream use.

### Lower Priority (Multi-Language Support)

9. **`--release-label` parameter**: Not implemented in Rust scripts (only in JS scripts).
10. **Path filtering on triggers**: Important for multi-language repos.
11. **Concurrency group prefix**: Language-specific prefix for multi-language repos.
12. **`defaults.run.working-directory`**: Needed for multi-language repos.
13. **`RUST_ROOT` explicit passing**: Safer than auto-detection.
14. **Granular change detection outputs**: `rust-code-changed`, `rust-package-changed`.
15. **Deploy docs `destination_dir` and `keep_files`**: For multi-language doc coexistence.

### Optional Enhancements

16. **Dependabot auto-merge workflow**: Numbers has this.
17. **Multi-language badge table format**: Numbers and browser-commander use tables.
18. **`cargo package --list --allow-dirty`**: lino-arguments uses this.
19. **Code quality badges**: Numbers has Codacy and CodeFactor badges.
