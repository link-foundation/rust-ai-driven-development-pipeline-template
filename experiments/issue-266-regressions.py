#!/usr/bin/env python3
"""Run the issue #266 Rust CLIs against local files, HTTP and a mock gh."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import signal
import socket
import subprocess
import sys
import tempfile
import threading
import unittest

ROOT = Path(__file__).resolve().parents[1]
INDEX = "/fi/xt/fixture"
API = "/api/v1/crates/fixture/1.2.3"
DUPLICATE = '{"errors":[{"resource":"Release","code":"already_exists","field":"tag_name"}]}'
PIPE_BYTES = 131_072


def mock_gh():
    import resource

    resource.setrlimit(resource.RLIMIT_AS, (256 * 1024**2, 256 * 1024**2))
    assert sys.argv[1:] == ["api", "repos/fixture/repo/releases", "-X", "POST", "--input", "-"]
    mode = os.environ["FIXTURE_GH_MODE"]
    if mode == "early-success":
        return 0
    if mode == "early-duplicate":
        print(DUPLICATE, file=sys.stderr)
        return 1
    if mode in ("stdout", "stderr"):
        stream = getattr(sys, mode)
        stream.write("x" * PIPE_BYTES + "\n")
        stream.flush()
    Path("payload.json").write_bytes(sys.stdin.buffer.read())
    if mode in ("stdout", "stderr"):
        print("captured stdout")
        print("captured stderr", file=sys.stderr)
        return 17
    return 0


def build_script(path):
    result = subprocess.run(
        ["rust-script", "--wrapper", "echo", str(path)],
        cwd=ROOT, text=True, capture_output=True, check=False,
    )
    if result.returncode:
        raise RuntimeError(result.stdout + result.stderr)
    return result.stdout.strip()


class RegistryHandler(BaseHTTPRequestHandler):
    def log_message(self, *_args):
        pass

    def do_GET(self):
        self.server.requests.append(self.path)
        status, body = self.server.responses[self.path]
        if status == 0:
            self.connection.shutdown(socket.SHUT_RDWR)
            return
        truncated = status == -200
        self.send_response(abs(status))
        self.send_header("Content-Length", str(len(body) + truncated))
        self.end_headers()
        self.wfile.write(body)


class ReleaseRegressions(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if os.name != "posix":
            raise unittest.SkipTest("POSIX process groups required")
        cls.temp = tempfile.TemporaryDirectory(prefix="issue-266-")
        cls.addClassCleanup(cls.temp.cleanup)
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), RegistryHandler)
        cls.addClassCleanup(cls.server.server_close)
        cls.server_thread = threading.Thread(target=cls.server.serve_forever)
        cls.server_thread.start()
        cls.addClassCleanup(cls.server_thread.join)
        cls.addClassCleanup(cls.server.shutdown)

        cls.binaries = {}
        sources = Path(cls.temp.name)
        # Redirect only the production origins. Keep parsing and CLI logic intact.
        for name in ("wait-for-crate.rs", "registry.rs", "github-output.rs", "rust-paths.rs"):
            original = (ROOT / "scripts" / name).read_text()
            for origin in ("https://index.crates.io/", "https://crates.io/api/"):
                address = f"http://127.0.0.1:{cls.server.server_port}/"
                original = original.replace(origin, address + ("api/" if "/api/" in origin else ""))
            (sources / name).write_text(original)
        cls.binaries["wait-for-crate"] = build_script(sources / "wait-for-crate.rs")
        for script in ("get-version", "check-file-size", "create-github-release"):
            cls.binaries[script] = build_script(ROOT / "scripts" / f"{script}.rs")

    def setUp(self):
        temp = tempfile.TemporaryDirectory(prefix="issue-266-fixture-")
        self.addCleanup(temp.cleanup)
        self.work = Path(temp.name)
        self.manifest = self.work / "Cargo.toml"
        self.manifest.write_text('[package]\nname="fixture"\nversion="1.2.3"\n')
        self.output = self.work / "outputs"
        self.env = {
            **os.environ,
            "RUST_ROOT": ".",
            "GITHUB_OUTPUT": str(self.output),
            "PATH": f"{self.work}{os.pathsep}{os.environ['PATH']}",
        }
        for key in ("TAG_PREFIX", "RELEASE_LABEL", "CRATES_IO_URL", "DOCKER_HUB_URL"):
            self.env.pop(key, None)
        gh = self.work / "gh"
        gh.write_bytes(Path(__file__).read_bytes())
        gh.chmod(0o755)

    def run_cli(self, script, *args, deadline=10):
        with subprocess.Popen(
            [self.binaries[script], *args], cwd=self.work, env=self.env,
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, start_new_session=True, text=True,
        ) as proc:
            try:
                stdout, stderr = proc.communicate(timeout=deadline)
            except subprocess.TimeoutExpired:
                os.killpg(proc.pid, signal.SIGKILL)
                proc.communicate()
                self.fail(f"{script} exceeded its {deadline}-second deadline")
        return subprocess.CompletedProcess(proc.args, proc.returncode, stdout, stderr)

    def test_workspace_falls_back_only_for_missing_or_private_members(self):
        self.manifest.write_text('[workspace]\nmembers=["broken","private","public"]\n')
        for name in ("broken", "private", "public"):
            (self.work / name).mkdir()
        (self.work / "private/Cargo.toml").write_text(
            '[package]\nname="private"\nversion="8.8.8"\npublish=false\n'
        )
        (self.work / "public/Cargo.toml").write_text('[package]\nname="public"\nversion="2.0.0"\n')
        result = self.run_cli("get-version")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.output.read_text(), "version=2.0.0\n")
        self.output.unlink()

        broken = self.work / "broken/Cargo.toml"
        broken.write_bytes(b"\xff")
        for invalid_utf8 in (True, False):
            with self.subTest(invalid_utf8=invalid_utf8):
                if not invalid_utf8:
                    broken.unlink()
                    broken.mkdir()
                result = self.run_cli("get-version")
                self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
                self.assertIn("broken/Cargo.toml", result.stderr)
                self.assertFalse(self.output.exists())

    def test_file_size_gate_reports_read_error_with_other_findings(self):
        (self.work / "target").mkdir()
        (self.work / "target/ignored.rs").write_bytes(b"\xff")
        (self.work / "binary.png").write_bytes(b"\xff")
        self.env["CHANGED_FILES"] = "near.rs"
        self.assertEqual(self.run_cli("check-file-size").returncode, 0)

        (self.work / "src").mkdir()
        broken = self.work / "src/broken.rs"
        broken.write_bytes(b"\xff")
        result = self.run_cli("check-file-size")
        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertIn("src/broken.rs", result.stderr)
        self.assertNotIn("All files are within", result.stdout)

        (self.work / "too-large.rs").write_text("\n" * 1001)
        (self.work / "near.rs").write_text("\n" * 901)
        result = self.run_cli("check-file-size")
        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertIn("src/broken.rs", result.stderr)
        self.assertIn("too-large.rs: 1001 lines", result.stdout)
        self.assertIn("::warning file=near.rs", result.stdout)

    def release(self, notes, mode="short", version="1.2.3"):
        (self.work / "CHANGELOG.md").write_text(f"## [1.2.3]\n{notes}## [1.2.2]\nolder\n")
        self.env["FIXTURE_GH_MODE"] = mode
        (self.work / "payload.json").unlink(missing_ok=True)
        return self.run_cli(
            "create-github-release", "--release-version", version,
            "--repository", "fixture/repo", deadline=2,
        )

    def test_false_closing_fences_keep_release_notes_intact(self):
        for delimiter in ("```", "~~~"):
            for suffix in ("\u00a0", "\u2003", "\u202f", "\v", "\f"):
                with self.subTest(delimiter=delimiter, suffix=suffix):
                    notes = f"{delimiter}md\n{delimiter}{suffix}\n## [9.9.9]\n{delimiter} \t\n"
                    result = self.release(notes, version="9.9.9")
                    self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
                    self.assertIn("Missing required changelog entry", result.stderr)
                    self.assertFalse((self.work / "payload.json").exists())
                    result = self.release(notes)
                    self.assertEqual(result.returncode, 0, result.stderr)
                    self.assertTrue(self.payload()["body"].endswith(notes))

    def payload(self):
        return json.loads((self.work / "payload.json").read_bytes())

    def test_release_drains_both_output_pipes_before_request_is_consumed(self):
        # Escaped backslashes make the serialized JSON exceed the test pipe capacity,
        # while the release notes stay under GitHub's character limit.
        notes = "\\" * 110_000 + "\n"
        for stream in ("stdout", "stderr"):
            with self.subTest(stream=stream):
                result = self.release(notes, mode=stream)
                self.assertEqual(result.returncode, 1, result.stdout + result.stderr[-100:])
                self.assertTrue(self.payload()["body"].endswith(notes))
                self.assertIn("x" * PIPE_BYTES + "\n", result.stderr)
                self.assertIn("captured stdout", result.stderr)
                self.assertIn("captured stderr", result.stderr)
                self.assertNotIn("Created GitHub release", result.stdout)

    def test_release_reports_incomplete_request_even_if_child_reports_success_or_duplicate(self):
        for mode in ("early-success", "early-duplicate"):
            with self.subTest(mode=mode):
                result = self.release("\\" * 110_000 + "\n", mode=mode)
                self.assertNotEqual(result.returncode, 0, result.stdout + result.stderr)
                self.assertIn("Failed to write release payload to gh stdin", result.stderr)
                self.assertNotIn("Created GitHub release", result.stdout)
                self.assertNotIn("already exists, skipping", result.stdout)

    def test_release_still_sends_short_request(self):
        result = self.release("Short notes.\n")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("Created GitHub release: v1.2.3", result.stdout)
        self.assertEqual(self.payload()["tag_name"], "v1.2.3")
        self.assertTrue(self.payload()["body"].endswith("Short notes.\n"))

    def test_waiter_requires_complete_registry_response_for_requested_version(self):
        missing = (404, b"")
        drop = (0, b"")
        index_match = b'{"name":"fixture","vers":"1.2.3"}'
        version_match = b'{"version":{"crate":"fixture","num":"1.2.3"}}'
        cases = [
            ("missing API metadata", missing, (200, b"{}"), "unknown"),
            ("empty API response", missing, (200, b""), "unknown"),
            ("wrong API version", (429, b""), (200, b'{"version":{"num":"0.0.0"}}'), "unknown"),
            ("wrong API crate", missing, (200, version_match.replace(b"fixture", b"other")), "unknown"),
            ("broken API JSON", missing, (200, version_match + b"garbage"), "unknown"),
            ("invalid API UTF-8", missing, (200, version_match + b"\xff"), "unknown"),
            ("partial HTTP status", (429, b""), (206, version_match), "unknown"),
            ("incomplete API body", missing, (-200, version_match), "unknown"),
            ("fake index record", (200, b'not-json "vers":"1.2.3"'), missing, "unknown"),
            ("empty index", (200, b""), missing, "unknown"),
            ("invalid index version", (200, b'{"vers":"latest"}'), missing, "unknown"),
            ("invalid index UTF-8", (200, index_match + b'\n{"vers":"\xff"}'), missing, "unknown"),
            ("index valid prefix", (200, index_match + b"\n{}"), missing, "unknown"),
            ("incomplete index body", (-200, index_match), missing, "unknown"),
            ("wrong index crate", (200, index_match.replace(b"fixture", b"other")), missing, "unknown"),
            ("exact index match", (200, index_match), None, "available"),
            ("different index version", (200, index_match.replace(b"1.2.3", b"1.1.0")), missing, "absent"),
            ("exact API fallback", missing, (200, version_match), "available"),
            ("exact API without crate field", missing, (200, b'{"version":{"num":"1.2.3"}}'), "available"),
            ("exact API after transport error", drop, (200, version_match), "available"),
            ("both absent", missing, missing, "absent"),
            ("404 with transient status", missing, (500, b""), "absent"),
            ("forbidden", (403, b""), (502, b""), "unknown"),
            ("transient failures", (429, b""), (503, b""), "unknown"),
            ("dropped connection", drop, (503, b""), "unknown"),
        ]
        for label, index, api, expected in cases:
            with self.subTest(case=label):
                self.output.unlink(missing_ok=True)
                self.server.requests = []
                self.server.responses = {INDEX: index, API: api or missing}
                result = self.run_cli("wait-for-crate", "--max-attempts", "1", "--sleep-seconds", "0")
                self.assertEqual(self.server.requests, [INDEX] if api is None else [INDEX, API])
                if expected == "available":
                    self.assertEqual(result.returncode, 0, result.stderr)
                    self.assertEqual(self.output.read_text(), "crate_available=true\n")
                else:
                    self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
                    self.assertFalse(self.output.exists())
                    message = "could not determine" if expected == "unknown" else "was not visible"
                    self.assertIn(message, result.stderr)


if __name__ == "__main__":
    if Path(sys.argv[0]).name == "gh":
        sys.exit(mock_gh())
    unittest.main()
