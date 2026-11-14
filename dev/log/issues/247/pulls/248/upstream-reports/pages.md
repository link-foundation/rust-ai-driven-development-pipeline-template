Verified against the current v5.0.1 bundle on 2026-11-14: `dist/index.js` still contains `module.exports = require("punycode")` (module 85477). This remains distinct from retired Node runtime warnings.

Minimal reproduction: a normal `actions/deploy-pages@v5` step for a valid Pages artifact; alternatively `node --throw-deprecation -e 'require("punycode")'` demonstrates the bundled core import's failure mode. Consumer: https://github.com/link-foundation/rust-ai-driven-development-pipeline-template/pull/248 .

The temporary consumer workaround suppresses only DEP0040 for this action; all other warnings and deployment errors remain visible. Updating the dependency importing core punycode to its userland replacement, regenerating dist, and running a deployment smoke test with deprecations fatal would remove this exception. We have no evidence connecting this warning to the 404 reported in another comment.
