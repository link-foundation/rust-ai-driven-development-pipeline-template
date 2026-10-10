---
bump: patch
---

### Fixed
- Fail every Rust Actions output producer when a configured output cannot be opened or written, while supporting local runs without GITHUB_OUTPUT.
- Report changelog directory, fragment-read and cleanup failures instead of silently skipping or losing release fragments.
- Match both local zizmor commands to the action's repository-wide scan, including Dependabot configurations.
