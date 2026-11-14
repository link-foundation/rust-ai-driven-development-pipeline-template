Reconfirmed on Linux with the current 1.7.12 release while updating https://github.com/link-foundation/rust-ai-driven-development-pipeline-template/pull/248 .

The existing minimal workflow with `concurrency: {group: release, queue: max}` still produces `unexpected key "queue" for "concurrency" section`. Our release workflows require queue serialization and retain only the existing narrow ignore for this diagnostic; all other Actionlint, ShellCheck and workflow security checks remain active.

The proposed enum/schema validation in #654 would remove the local exception. No new issue is needed; this adds another current-release consumer and verification result to the existing reproducer.
