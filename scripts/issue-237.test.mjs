// Focused policy and failure-path regressions for issues 234–236.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { extractBrokenLinks, validateLycheeReport } from './check-web-archive.mjs';
import { parseLycheeFailures, recheckUnanswered, allFailuresRecovered } from './recheck-broken-links.mjs';

const report = (errors, timeouts) => `# Link Checker Report
| Errors | ${errors.length} |
| Timeouts | ${timeouts.length} |
${errors.length ? `## Errors per input\n${errors.join('\n')}` : ''}
${timeouts.length ? `## Timeouts per input\n${timeouts.join('\n')}` : ''}
## Redirects per input
- [301] https://example.com/redirect
`;

test('timeout-only and mixed reports reach both consumers and count every failure', async () => {
  for (const errors of [[], ['- [503] https://example.com/transient']]) {
    const content = report(errors, ['- [TIMEOUT] https://example.com/timeout']);
    assert.doesNotThrow(() => validateLycheeReport(content, '2'));
    const urls = [...(errors.length ? ['https://example.com/transient'] : []), 'https://example.com/timeout'];
    assert.deepEqual(extractBrokenLinks(content), { urls, others: [] });
    assert.deepEqual(parseLycheeFailures(content).map((failure) => failure.url), urls);
    assert.throws(() => validateLycheeReport(content.replace('| Timeouts | 1 |', '| Timeouts | 2 |'), '2'), /incomplete/);
    const calls = [];
    const result = await recheckUnanswered(urls, {
      fetchImpl: async (url) => { calls.push(url); return new Response('', { status: url.endsWith('timeout') ? 404 : 200 }); },
      accept: '200..=299', userAgent: 'regression-test', budgetSeconds: 1, initialWaitMs: 0,
    });
    assert.deepEqual(calls, urls);
    assert.equal(allFailuresRecovered(0, urls.length, result), false);
  }
});

test('only a link verdict can recover; runtime/config errors always fail closed', () => {
  for (const exit of ['1', '3', '4', '124', '']) {
    for (const content of [report([], []), report([], ['- [TIMEOUT] https://example.com/timeout'])]) {
      assert.throws(() => validateLycheeReport(content, exit), /runtime\/configuration/);
    }
  }
  assert.doesNotThrow(() => validateLycheeReport(report([], []), '0'));
});

test('active workflows restore caches, save only on main push misses, and restrict Docker exports', () => {
  let restores = 0;
  let saves = 0;
  for (const name of readdirSync('.github/workflows').filter((name) => /\.ya?ml$/.test(name))) {
    const text = readFileSync(`.github/workflows/${name}`, 'utf8');
    assert.doesNotMatch(text, /uses: actions\/cache@/);
    for (const job of text.split(/(?=^  [a-z][a-z0-9-]*:\s*$)/m)) {
      for (const step of job.split(/(?=^      - )/m)) {
        if (step.includes('uses: actions/cache/restore@')) restores++;
        if (step.includes('uses: actions/cache/save@')) {
          saves++;
          assert.match(step, /if: github.event_name == 'push' && github.ref == 'refs\/heads\/main' && steps\.(cache-\d+)\.outputs.cache-hit != 'true'/);
          const id = step.match(/steps\.(cache-\d+)\.outputs.cache-hit/)[1];
          assert.ok(job.includes(`id: ${id}\n        uses: actions/cache/restore@`));
          assert.ok(step.includes(`key: \${{ steps.${id}.outputs.cache-primary-key }}`));
        }
      }
      if (job.startsWith('  fresh-merge:')) {
        assert.doesNotMatch(job, /cache\/save@|cargo-fresh-merge-/);
        assert.match(job, /cargo-lint-/);
      }
    }
    for (const line of text.split('\n').filter((line) => line.includes('cache-to:'))) {
      assert.match(line, /github.event_name == 'push' && github.ref == 'refs\/heads\/main'.*\|\| ''/);
    }
  }
  assert.equal(restores, 8);
  assert.equal(saves, 7);
  const links = readFileSync('.github/workflows/links.yml', 'utf8');
  assert.match(links, /schedule:\n    - cron: '41 5 \* \* 1'/);
  assert.doesNotMatch(links, /github.run_id/);
  assert.match(links, /if: steps.lychee.outputs.exit_code == '2'/);
  assert.match(links, /\(steps.lychee.outputs.exit_code != '2' \|\| steps.recheck.outputs.all_recovered != 'true'\)/);
});

test('ShellCheck uses the pinned venv binary even when the runner has shellcheck', () => {
  const text = readFileSync('.github/workflows/workflows.yml', 'utf8');
  assert.doesNotMatch(text, /pipx run --spec shellcheck/);
  assert.match(text, /python3 -m venv "\$RUNNER_TEMP\/shellcheck-venv"/);
  assert.match(text, /"\$RUNNER_TEMP\/shellcheck-venv\/bin\/pip" install --quiet --disable-pip-version-check shellcheck-py==0\.11\.0\.1/);
  assert.match(text, /xargs -0 "\$RUNNER_TEMP\/shellcheck-venv\/bin\/shellcheck"/);
});
