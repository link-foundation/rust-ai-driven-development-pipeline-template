---
bump: patch
---

### Fixed
- Harden the Docker publish step against transient Docker Hub registry outages. `release.yml` now boots buildx via the new `setup-buildx-resilient` composite action, which pre-pulls the pinned `moby/buildkit:buildx-stable-1` image with retries and a `mirror.gcr.io` pull-through fallback before the docker-container driver boots, so a registry blip no longer fails the release ([#69](https://github.com/link-foundation/rust-ai-driven-development-pipeline-template/issues/69)).
