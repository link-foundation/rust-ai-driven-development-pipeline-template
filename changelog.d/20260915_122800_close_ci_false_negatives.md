---
bump: patch
---

### Fixed

- Link recovery now considers every original failure, including final HTTP responses, before releasing the link-check gate (#170)
- Cancelled jobs are excused only when their own effective concurrency policy proves a superseding run could cancel them (#171)
- Step budgets isolate output from surviving descendants and can detect, terminate, and report privileged process-group survivors (#172)
- Manual changelog descriptions cannot inject GitHub Actions workflow commands through generated fragment output (#173)
- Changelog and version policy checks fail closed when their base diff is unavailable and retry after fetching the explicit base ref (#174)
- Pipeline status checks remain portable to the Bash 3.2 macOS runner, and the file-size gate freezes existing source debt while excluding generated changelog history
