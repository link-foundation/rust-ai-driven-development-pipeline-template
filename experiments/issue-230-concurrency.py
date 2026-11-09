#!/usr/bin/env python3
"""Evaluate actual workflow cancellation policies and the terminal gate offline."""
import os
from pathlib import Path
import re
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[1]
WRITERS = {'auto-release', 'manual-release', 'docker-publish', 'docker-merge-manifest',
           'changelog-pr', 'deploy-docs', 'publish', 'finalize'}


def jobs(path):
    content = path.read_text().split('\njobs:\n', 1)[1]
    return [(m.group(1), m.group(2)) for m in re.finditer(
        r'^  ([\w-]+):\n(.*?)(?=^  [\w-]+:\n|\Z)', content, re.M | re.S)]


class Concurrency(unittest.TestCase):
    def test_every_concurrent_job_on_main_and_pr(self):
        for path in (ROOT / '.github/workflows').glob('*.yml'):
            self.assertNotIn('\nconcurrency:', path.read_text().split('\njobs:\n')[0])
            if path.name == 'rerun-infrastructure-failures.yml':
                continue  # Per-run Actions retry coordinator; never a superseded check.
            for name, body in jobs(path):
                if '\n    concurrency:' not in '\n' + body:
                    continue
                group = re.search(r'^      group: (.+)$', body, re.M).group(1)
                expected = 'false' if name in WRITERS else 'true'
                for ref in ['refs/heads/main', 'refs/pull/233/merge']:
                    with self.subTest(workflow=path.name, job=name, ref=ref):
                        result = subprocess.run(['bash', 'scripts/read-job-cancel-in-progress.sh'],
                            cwd=ROOT, env={**os.environ, 'WORKFLOW_FILE': str(path),
                            'JOB_NAMES': name, 'GITHUB_REF': ref}, text=True,
                            capture_output=True, check=True, timeout=10)
                        self.assertEqual(result.stdout.strip(), name + '\t' + expected)
                if name in WRITERS:
                    self.assertEqual(group, 'main-writer-${{ github.repository }}')
                    self.assertIn('queue: max', body)
                if 'matrix:' in body and name not in WRITERS:
                    matrix = body.split('matrix:', 1)[1].split('steps:', 1)[0]
                    dimensions = re.findall(r'^        ([\w-]+):\s*\[', matrix, re.M)
                    if dimensions:
                        for dimension in dimensions:
                            self.assertIn('matrix.' + dimension, group)
                    else:
                        self.assertIn('matrix.', group)

    def test_real_gate_excuses_only_superseded_checks(self):
        for ref in ['refs/heads/main', 'refs/pull/233/merge']:
            for job, superseded, success in [('test', True, True), ('test', False, False),
                                            ('auto-release', True, False), ('auto-release', False, False)]:
                with self.subTest(ref=ref, job=job, superseded=superseded):
                    env = {k: v for k, v in os.environ.items() if not k.startswith(('GH_', 'GITHUB_'))}
                    env.update(NEEDS_JSON='{"' + job + '":{"result":"cancelled"}}',
                               WORKFLOW_FILE=str(ROOT / '.github/workflows/release.yml'),
                               RUN_SHA='1' * 40, BRANCH_HEAD_SHA=('2' if superseded else '1') * 40,
                               GITHUB_REF=ref, HEAD_REF=ref)
                    result = subprocess.run(['bash', 'scripts/check-pipeline-status.sh'], cwd=ROOT,
                                            env=env, text=True, capture_output=True, timeout=10)
                    self.assertEqual(result.returncode == 0, success, result.stdout + result.stderr)


if __name__ == '__main__':
    unittest.main()
