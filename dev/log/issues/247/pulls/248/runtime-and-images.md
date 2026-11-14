# Runtimes, tools, hooks and images

Live upstream/registry queries on 2026-11-14 UTC supplement the complete package
and action tables in [dependency-versions.md](dependency-versions.md). A floating
release alias resolves to the listed release today. System runner utilities
(Git, Bash, curl, tar, rustup and pipx bootstrap launchers) are supplied by the
current hosted runner; package managers install the explicitly selected tools.
No additional language dependency manifests were found for shell scripts.

| Dependency | Before | Latest released today | After / decision | Primary evidence |
| --- | --- | --- | --- | --- |
| Rust runtime | stable, implicit | 1.100.0 | 1.100.0, rust-toolchain.toml and all production jobs | [Release](https://blog.rust-lang.org/2026/11/12/Rust-1.100.0/) |
| Rust edition / supported floor | 2021 / 1.70 | 2024 / compiler 1.100.0 | 2024 / 1.85; current production dependencies require 1.85, tested separately in CI | [Edition guide](https://doc.rust-lang.org/edition-guide/rust-2024/index.html) |
| Node.js | 24 | 26.13.1 | >=26.13.1 in all three packages, exact CI runtime | registry-latest.json, [Release feed](https://nodejs.org/dist/index.json) |
| npm | runtime bundle | 12.2.2 | >=12.2.2, packageManager npm@12.2.2; CI installs explicitly because Node's bundle is older | npm-release.json, [Registry](https://registry.npmjs.org/npm/latest) |
| Python | hosted runner default | 3.15.2 | .python-version and shared setup action select 3.15.2 | python-releases.json, [Security release](https://www.python.org/downloads/release/python-3152/) |
| pip | implicit | 26.3 | 26.3, universal hashed requirements | registry-latest.json, [PyPI](https://pypi.org/project/pip/) |
| uv | no tracked pin | 0.13.8 | 0.13.8, universal hash-lock compiler | registry-latest.json, [PyPI](https://pypi.org/project/uv/) |
| pre-commit | no tracked pin | 4.7.0 | 4.7.0, universal hashed requirements | registry-latest.json |
| pre-commit-hooks | 5.0.0 | 6.0.0 | 6.0.0 in hook configuration and hashed requirements | hooks-release.json |
| shellcheck-py | 0.11.0.1 | 0.11.0.1 | Current hook and hash-locked executable | registry-latest.json |
| pyflakes | absent | 4.1.0 | 4.1.0, every tracked Python file linted | registry-latest.json |
| zizmor | 1.30.1 | 1.32.0 | 1.32.0 in both security passes, local repro and hash-lock | registry-latest.json |
| pip-audit | absent | 2.10.1 | 2.10.1, strict hash-locked environment audit | registry-latest.json |
| rust-script | 0.36.0 | 0.36.0 | Current; installer already pins it | registry-latest.json |
| cargo-audit | 0.22.2 | 0.23.0 | 0.23.0, validate dependency graph before advisory rendering | audit-release.json |
| cargo-llvm-cov | implicit latest | 0.9.1 | Explicit 0.9.1 | registry-latest.json |
| actionlint | 1.7.12 | 1.7.12 | Current, immutable container digest b1934ee5f1c509618f2508e6eb47ee0d3520686341fec936f3b79331f9315667 | actionlint-release.json, actionlint-image.txt |
| lychee | action default | 0.24.2 | Current action v2.9.0 default; external bounded rechecker still required | lychee-release.json |
| CodeQL bundle | action default | 2.27.4 | Current action v4.39.3 default; extraction warnings remain fatal | codeql-releases.json |
| Docker Buildx | action default | 0.39.0 | Current official setup action downloads latest; its own retry implementation replaces ours | buildx-release.json |
| BuildKit image | moby/buildkit:buildx-stable-1 | v0.35.0 | moby/buildkit:v0.35.0; resolved image index aa632b921ef07411d2cb77292cd34213d4f7b384001d6fceef1e1f25bf9752bb | buildkit-release.json, buildkit-release-image.txt |
| Rust container base | 1.100.0-slim, digest e9d95b74296f7126a83ae3d041aeaba1ff4c478f13abc5cc034fcf7c131c3d4a | 1.100.0-slim, same digest | Already current, digest retained | rust-image.txt |
| Final example container | scratch | scratch | Dependency-free empty filesystem, unchanged | examples/javascript-first/Dockerfile |

The example Cargo lock was regenerated with the current compiler. Its only entry
is the example package itself, so its bytes correctly remain unchanged. Root and
example application versions are release metadata, not dependencies; the new
changelog fragment is the documented release trigger. The release writer owns
version bumps after merge.

Dependabot covers Cargo /, npm /.github/dependency-policy and /.github/secretlint,
pip /, pre-commit /, rust-toolchain /, actions / and Docker /examples/javascript-first.
The example has no Cargo or npm dependencies, so additional updater entries there
would be empty: the existing policy deliberately rejects ghost update surfaces.
