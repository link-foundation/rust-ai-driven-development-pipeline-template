Current downstream confirmation: the latest release endpoint still returns lychee 0.24.2 (2026-11-14). We retain a bounded external retry adapter in https://github.com/link-foundation/rust-ai-driven-development-pipeline-template/pull/248 for this reported connect-reset gap.

The minimal HTTPS RST server in this issue remains the relevant reproduction. Our offline regression tests preserve failure for permanent 404 responses, bound retries for unanswered connections and transient 429/5xx statuses, and reuse the same accepted statuses and user agent. Increasing lychee's retry count alone cannot change the connect-phase classifier.

The existing proposed fix that examines connect-phase I/O errors and unwraps nested `io::Error` values would let us remove the adapter once released. This records the consumer workaround rather than duplicate the report.
