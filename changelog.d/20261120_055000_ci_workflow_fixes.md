### Fixed

- Make GitHub Pages documentation deployment opt-in with `DEPLOY_GITHUB_PAGES=true`, and log the setup steps.
- Audit every tracked `Cargo.lock` with strict warning handling and fail if a tracked lockfile is missing from the checkout.
- Exclude current and stale checksum manifests from desktop release checksums and asset artifacts.
