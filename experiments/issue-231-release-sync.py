#!/usr/bin/env python3
"""Actual release CLI against local Git origins and a local registry; no publication."""
import http.server
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import threading
import unittest

ROOT = Path(__file__).resolve().parents[1]


class ReleaseSync(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        class Registry(http.server.BaseHTTPRequestHandler):
            def log_message(self, *_args):
                pass

            def do_GET(self):
                self.send_response(404)
                self.send_header('Content-Length', '2')
                self.end_headers()
                self.wfile.write(b'{}')

        cls.server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Registry)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.temp = tempfile.TemporaryDirectory(prefix='issue-231-tools-')
        cls.scripts = Path(cls.temp.name) / 'scripts'
        shutil.copytree(ROOT / 'scripts', cls.scripts)
        for path in cls.scripts.rglob('*.rs'):
            path.write_text(path.read_text().replace('https://crates.io',
                            f'http://127.0.0.1:{cls.server.server_port}'))
        cls.runner = shutil.which('rust-script')
        subprocess.run([cls.runner, '--wrapper', 'true', str(cls.scripts / 'version-and-commit.rs')],
                       env={**os.environ, 'RUST_LOG': 'error'}, check=True)

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()
        cls.temp.cleanup()

    def setUp(self):
        self.tempdir = tempfile.TemporaryDirectory(prefix='issue-231-repo-')
        self.addCleanup(self.tempdir.cleanup)
        self.root = Path(self.tempdir.name)
        self.origin, self.work, self.other = [self.root / p for p in ('origin.git', 'release', 'other')]
        self.env = {k: v for k, v in os.environ.items() if not k.startswith('GITHUB_')}
        self.env.pop('RUST_ROOT', None)
        self.env['RUST_LOG'] = 'error'
        self.command(self.root, 'git', 'init', '--bare', '-q', '-b', 'main', str(self.origin))
        self.command(self.root, 'git', 'clone', '-q', str(self.origin), str(self.work))
        self.write(self.work, 'Cargo.toml', '[package]\nname="fixture"\nversion="1.0.0"\n')
        self.write(self.work, 'Cargo.lock', 'version = 3\n[[package]]\nname="fixture"\nversion="1.0.0"\n')
        self.write(self.work, 'src/lib.rs', 'pub fn fixture() {}\n')
        self.write(self.work, 'CHANGELOG.md', '## [1.0.0]\n\nOriginal.\n')
        self.write(self.work, 'changelog.d/fix.md', '---\nbump: patch\n---\n\n### Fixed\n- A fix.\n')
        self.write(self.work, 'package.json', '{"name":"native-fixture","version":"1.0.0","scripts":{"test":"node test.js"}}\n')
        self.write(self.work, 'package-lock.json', '{"name":"native-fixture","version":"1.0.0","lockfileVersion":3,"packages":{"":{"name":"native-fixture","version":"1.0.0"}}}\n')
        self.commit(self.work)
        self.command(self.work, 'git', 'push', '-qu', 'origin', 'main')
        self.command(self.root, 'git', 'clone', '-q', str(self.origin), str(self.other))
        self.validated = self.git(self.work, 'rev-parse', 'HEAD')

    def command(self, cwd, *args, check=True):
        return subprocess.run(args, cwd=cwd, env=self.env, check=check,
                              capture_output=True, text=True, timeout=45)

    def git(self, cwd, *args):
        return self.command(cwd, 'git', *args).stdout.strip()

    def write(self, cwd, path, content):
        path = cwd / path
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content)

    def commit(self, cwd):
        self.git(cwd, 'add', '.')
        self.git(cwd, '-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'fixture')

    def advance(self, path, content):
        self.write(self.other, path, content)
        self.commit(self.other)
        self.git(self.other, 'push', '-q', 'origin', 'main')
        return self.git(self.other, 'rev-parse', 'HEAD')

    def race(self, path, content, second=None):
        self.write(self.other, path, content)
        self.commit(self.other)
        commits = [self.git(self.other, 'rev-parse', 'HEAD')]
        if second:
            self.write(self.other, *second)
            self.commit(self.other)
            commits.append(self.git(self.other, 'rev-parse', 'HEAD'))
        # Advance before Git advertises remote refs, so the real push reports
        # a non-fast-forward rather than a server-side ref-lock failure.
        tools = self.root / 'bin'
        tools.mkdir()
        marker = self.root / 'race-pending'
        marker.write_text('0')
        real_git = shutil.which('git')
        shim = tools / 'git'
        shim.write_text("#!/usr/bin/env python3\nimport os, pathlib, subprocess, sys\n"
                        + "marker = pathlib.Path(" + repr(str(marker)) + ")\n"
                        + "commits = " + repr(commits) + "\nindex = int(marker.read_text())\n"
                        + "if sys.argv[1:] == ['push'] and index < len(commits):\n"
                        + "    marker.write_text(str(index + 1))\n"
                        + "    subprocess.run([" + repr(real_git) + ", '-C', " + repr(str(self.other))
                        + ", 'push', '-q', 'origin', commits[index] + ':main'], check=True)\n"
                        + "os.execv(" + repr(real_git) + ", [" + repr(real_git) + ", *sys.argv[1:]])\n")
        shim.chmod(0o755)
        self.env['PATH'] = str(tools) + os.pathsep + self.env['PATH']

    def release(self):
        self.remote_manifest = self.git(self.root, '--git-dir', str(self.origin), 'show', 'main:Cargo.toml')
        return self.command(self.work, self.runner, str(self.scripts / 'version-and-commit.rs'),
                            '--bump-type', 'patch', check=False)

    def assert_refused(self, result):
        self.assertNotEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn('validated source', result.stderr)
        self.assertEqual(self.git(self.root, '--git-dir', str(self.origin), 'tag'), '')
        self.assertEqual(self.remote_manifest, self.git(self.root, '--git-dir', str(self.origin), 'show', 'main:Cargo.toml'))

    def test_initial_source_change_is_rejected(self):
        remote = self.advance('src/lib.rs', 'pub fn untested() {}\n')
        self.assert_refused(self.release())
        self.assertEqual(self.git(self.work, 'rev-parse', 'HEAD'), self.validated)
        self.assertEqual(self.git(self.root, '--git-dir', str(self.origin), 'rev-parse', 'main'), remote)

    def test_initial_dependency_change_is_rejected(self):
        self.advance('Cargo.toml', '[package]\nname="fixture"\nversion="1.0.1"\n[dependencies]\nevil="1"\n')
        self.assert_refused(self.release())

    def test_concurrent_source_push_is_rejected(self):
        self.race('src/new.rs', 'pub fn untested() {}\n')
        self.assert_refused(self.release())
        self.assertFalse((self.work / 'src/new.rs').exists())

    def test_concurrent_dependency_push_is_rejected(self):
        self.race('package.json', '{"name":"native-fixture","version":"1.0.1","dependencies":{"evil":"1"}}\n')
        self.assert_refused(self.release())

    def test_second_push_race_rechecks_the_original_validated_source(self):
        self.race('package.json', '{"name":"native-fixture","version":"1.0.1","scripts":{"test":"node test.js"}}\n',
                  second=('src/lib.rs', 'pub fn untested_second_race() {}\n'))
        result = self.release()
        self.assert_refused(result)
        self.assertIn('attempt 2/3', result.stderr)
        self.assertEqual((self.work / 'src/lib.rs').read_text(), 'pub fn fixture() {}\n')

    def metadata(self, race):
        content = '{"name":"native-fixture","version":"1.0.1","scripts":{"test":"node test.js"}}\n'
        if race:
            self.race('package.json', content)
        else:
            self.advance('package.json', content)
        result = self.release()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        remote = self.git(self.root, '--git-dir', str(self.origin), 'rev-parse', 'main')
        self.assertEqual(self.git(self.root, '--git-dir', str(self.origin), 'rev-parse', 'v1.0.1^{}'), remote)
        self.assertIn('1.0.1', (self.work / 'package.json').read_text())
        self.assertEqual((self.work / 'src/lib.rs').read_text(), 'pub fn fixture() {}\n')

    def test_initial_metadata_only_release_is_allowed(self):
        self.metadata(False)

    def test_concurrent_metadata_only_release_is_allowed(self):
        self.metadata(True)

    def test_initial_cargo_version_and_local_lock_metadata_are_allowed(self):
        self.write(self.other, 'Cargo.lock', 'version = 3\n[[package]]\nname="fixture"\nversion="1.0.1"\n')
        self.advance('Cargo.toml', '[package]\nname="fixture"\nversion="1.0.1"\n')
        result = self.release()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(self.git(self.work, 'rev-parse', 'v1.0.2^{}'), self.git(self.work, 'rev-parse', 'HEAD'))

    def test_initial_npm_lock_version_metadata_is_allowed(self):
        self.advance('package-lock.json', '{"name":"native-fixture","version":"1.0.1","lockfileVersion":3,"packages":{"":{"name":"native-fixture","version":"1.0.1"}}}\n')
        result = self.release()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_dependency_and_unsupported_metadata_changes_are_rejected(self):
        cases = {
            'Cargo.lock': 'version = 3\n[[package]]\nname="fixture"\nversion="1.0.0"\n[[package]]\nname="external"\nversion="2.0.0"\nsource="registry+https://example.invalid"\n',
            'package-lock.json': '{"name":"native-fixture","version":"1.0.1","lockfileVersion":3,"packages":{"":{"name":"native-fixture","version":"1.0.1","dependencies":{"external":"2"}}}}\n',
            'package.json': '{"name":"native-fixture","version":"1.0.1","scripts":{"test":"evil"}}\n',
            'nested/Cargo.toml': '[package]\nname="new"\nversion="1.0.0"\n',
            'changelog.d/fix.md': '### Fixed\n- Untested behavior.\n',
            'changelog.d/new.md': '### Fixed\n- Untested behavior.\n',
            '.github/workflows/new.yml': 'name: untested\n',
            'tests/fixtures/package.json': '{"version":"2.0.0"}\n',
        }
        for path, content in cases.items():
            with self.subTest(path=path):
                self.setUp()
                self.advance(path, content)
                self.assert_refused(self.release())
                self.assertEqual(self.git(self.work, 'rev-parse', 'HEAD'), self.validated)

    def test_consumed_fragments_and_changelog_are_allowed(self):
        (self.other / 'changelog.d/fix.md').unlink()
        self.advance('CHANGELOG.md', '## [1.0.1]\n\nConcurrent release.\n')
        result = self.release()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    @unittest.skipIf(os.name == 'nt', 'POSIX symlink fixture')
    def test_symlink_metadata_is_rejected(self):
        (self.other / 'package.json').unlink()
        (self.other / 'package.json').symlink_to('src/lib.rs')
        self.commit(self.other)
        self.git(self.other, 'push', '-q', 'origin', 'main')
        self.assert_refused(self.release())

    def test_missing_version_is_not_equivalent_metadata(self):
        self.advance('package.json', '{"name":"native-fixture","scripts":{"test":"node test.js"}}\n')
        self.assert_refused(self.release())

    def test_fetch_failure_is_fatal(self):
        self.git(self.work, 'remote', 'set-url', 'origin', str(self.root / 'missing.git'))
        self.assert_refused(self.release())
        self.assertEqual(self.git(self.work, 'rev-parse', 'HEAD'), self.validated)


if __name__ == '__main__':
    unittest.main()
