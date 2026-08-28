---
bump: patch
---

### Fixed
- `release.yml` built the multi-architecture manifest digest list with a single-quoted `printf` format, so `${DOCKERHUB_IMAGE}` was never expanded and `docker buildx imagetools create` received an invalid image reference (shellcheck SC2016).

### Added
- `workflows.yml` runs `actionlint` (Docker image, which bundles `shellcheck`) on every change under `.github/`, plus a `.github/actionlint.yaml` declaring the `macos-15-intel` and `windows-11-arm` runner labels the linter does not yet know.
