#!/usr/bin/env python3
"""Reproduce the duplicate-lock regression using Cargo's actual parser."""
from pathlib import Path
import os
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]


def metadata(manifest):
    return subprocess.run(
        ['cargo', 'metadata', '--locked', '--format-version', '1', '--manifest-path', str(manifest)],
        text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False,
    )


class DependencyRegressions(unittest.TestCase):
    def test_production_only_path_helpers_have_their_dependencies(self):
        # These scripts include rust-paths.rs only outside cfg(test). Building
        # their test harnesses alone cannot catch a missing regex dependency.
        for script in ('check-cargo-lock.rs', 'check-crate-size.rs'):
            with self.subTest(script=script), tempfile.TemporaryDirectory(prefix='issue-247-script-') as directory:
                package = Path(directory) / 'package'
                generated = subprocess.run(
                    ['rust-script', '--package', '--pkg-path', str(package), str(ROOT / 'scripts' / script)],
                    text=True, capture_output=True, check=False,
                )
                self.assertEqual(generated.returncode, 0, generated.stderr)
                env = dict(os.environ)
                env.setdefault('CARGO_TARGET_DIR', str(ROOT / 'target/issue-247-script-checks'))
                checked = subprocess.run(
                    ['cargo', 'check', '--quiet', '-j', '1', '--manifest-path', str(package / 'Cargo.toml')],
                    text=True, capture_output=True, check=False, env=env,
                )
                self.assertEqual(checked.returncode, 0, checked.stderr)

    def test_all_committed_locks_resolve_without_repair(self):
        for manifest in [ROOT / 'Cargo.toml', ROOT / 'examples/javascript-first/Cargo.toml']:
            with self.subTest(manifest=manifest):
                lock = manifest.with_name('Cargo.lock')
                before = lock.read_bytes()
                result = metadata(manifest)
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual(lock.read_bytes(), before, 'Validation must not repair the candidate')

    def test_cargo_rejects_the_original_duplicate_package_shape(self):
        with tempfile.TemporaryDirectory(prefix='issue-247-') as directory:
            root = Path(directory)
            (root / 'Cargo.toml').write_text('[package]\nname = "duplicate-lock"\nversion = "0.1.0"\nedition = "2024"\n')
            (root / 'src').mkdir()
            (root / 'src/main.rs').write_text('fn main() {}\n')
            package = '[[package]]\nname = "duplicate-lock"\nversion = "0.1.0"\n'
            (root / 'Cargo.lock').write_text('version = 4\n' + package + package)
            result = metadata(root / 'Cargo.toml')
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('specified twice in the lockfile', result.stderr)

    def test_audit_validates_the_locked_graph_before_presenting_advisories(self):
        workflow = (ROOT / '.github/workflows/security.yml').read_text()
        self.assertLess(workflow.index('cargo metadata --locked'), workflow.index('run: cargo audit'))
        self.assertIn('cargo audit --file Cargo.lock --deny warnings', workflow)


if __name__ == '__main__':
    unittest.main()
