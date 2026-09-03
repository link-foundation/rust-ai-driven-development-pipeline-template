---
bump: patch
---

### Security
- Audit the GitHub Actions workflows with `zizmor` in `workflows.yml` and add `.github/zizmor.yml`, which requires hash pins for every action outside the trusted first-party namespaces (issue #147).
- Hash-pin `dtolnay/rust-toolchain` (restating `toolchain: stable`, which the mutable `stable` branch used to supply), `taiki-e/install-action`, `codecov/codecov-action`, and `peter-evans/create-pull-request`.
- Set `persist-credentials: false` on every read-only checkout, so `GITHUB_TOKEN` is no longer written to `.git/config` in jobs that never push.
- Pass `github.repository`, `github.server_url`, `github.run_id`, and `matrix.label` through `env:` instead of interpolating them into `run:` blocks.
