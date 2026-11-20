import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import YAML from '../.github/dependency-policy/node_modules/yaml/dist/index.js';

function jobs(workflow) {
  return YAML.parse(readFileSync(new URL(`../.github/workflows/${workflow}.yml`, import.meta.url), 'utf8')).jobs;
}

function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), 'issue-252-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

function bash(command, cwd, env = {}) {
  return spawnSync('/bin/bash', ['-e', '-o', 'pipefail', '-c', command], {
    cwd, env: { ...process.env, ...env }, encoding: 'utf8',
  });
}

test('Pages jobs require opt-in and provide actionable setup messages', () => {
  const release = jobs('release');
  const deploy = release['deploy-docs'];
  assert.match(deploy.if, /^vars\.DEPLOY_GITHUB_PAGES == 'true' &&/);
  assert.match(deploy.if, /github\.event_name == 'push' && github\.ref == 'refs\/heads\/main'/);
  assert.match(deploy.if, /github\.event_name == 'workflow_dispatch' && github\.event\.inputs\.release_mode == 'instant'/);

  const notice = release['pipeline-status'].steps.find(({ name }) => name === 'Explain optional Pages deployment');
  assert.equal(notice.if, "vars.DEPLOY_GITHUB_PAGES != 'true'");
  assert.match(bash(notice.run, process.cwd()).stdout, /::notice::.*Source.*GitHub Actions.*DEPLOY_GITHUB_PAGES=true/);
  const configure = deploy.steps.find(({ id }) => id === 'pages');
  assert.equal(configure.uses, 'actions/configure-pages@v6');
  assert.equal(configure['continue-on-error'], undefined);
  const failure = deploy.steps.find(({ name }) => name === 'Explain Pages deployment failure');
  assert.equal(failure.if, "failure() && (steps.pages.outcome == 'failure' || steps.deployment.outcome == 'failure')");
  assert.match(bash(failure.run, process.cwd()).stdout, /::error::.*Source.*GitHub Actions/);
  assert.ok(deploy.steps.indexOf(configure) < deploy.steps.findIndex(({ name }) => name === 'Build documentation'));
});

test('the Cargo audit checks every tracked lock with deny warnings and reports missing files', (t) => {
  const directory = fixture(t);
  const git = (...args) => execFileSync('git', args, { cwd: directory, stdio: 'pipe' });
  const locks = ['Cargo.lock', 'examples/nested crate/Cargo.lock', 'experiments/a\nline/Cargo.lock'];
  const untracked = 'untracked/Cargo.lock';
  const bin = join(directory, 'bin');
  mkdirSync(bin);
  writeFileSync(join(bin, 'cargo'), `#!/bin/bash
[[ $# -eq 5 && $1 == audit && $2 == --file && $4 == --deny && $5 == warnings ]] || exit 2
path=${'$'}{3#./}
printf '%s\\0' "$path" >> "$AUDITS"
[[ "$path" != "$FAIL_LOCK" ]]
`, { mode: 0o755 });
  git('init', '-q');
  for (const lock of [...locks, untracked]) {
    const path = join(directory, lock);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, '');
  }
  git('add', '--', ...locks);
  git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'fixture');

  const step = jobs('security')['cargo-audit'].steps.find(({ name }) => name?.startsWith('Audit committed Cargo.lock'));
  const callLog = join(directory, 'audited');
  function audit(failLock = '') {
    writeFileSync(callLog, '');
    const result = bash(step.run, directory, {
      PATH: `${bin}:${process.env.PATH}`, AUDITS: callLog, FAIL_LOCK: failLock,
    });
    return { ...result, calls: readFileSync(callLog, 'utf8').split('\0').slice(0, -1) };
  }

  const passing = audit();
  assert.equal(passing.status, 0, passing.stderr);
  assert.deepEqual(passing.calls, locks);
  const rejected = audit(locks[1]);
  assert.equal(rejected.status, 1);
  assert.deepEqual(rejected.calls, locks, 'a failed audit must not hide later reports');
  rmSync(join(directory, locks[1]));
  const missing = audit();
  assert.equal(missing.status, 1);
  assert.match(missing.stdout, /::error::.*committed but not checked out/);
  assert.deepEqual(missing.calls, [locks[0], locks[2]]);
});

const desktopSteps = jobs('desktop-release').build.steps;
const checksumCommand = desktopSteps.find(({ name }) => name === 'Create checksum fragment').run;
const fragmentPath = desktopSteps.find(({ name }) => name === 'Upload checksum fragment')
  .with.path.replace('${{ matrix.label }}', 'fixture');

for (const hash of ['sha256sum', 'shasum']) {
  test(`desktop checksum uses only assets with ${hash}, even in a reused directory`, (t) => {
    const directory = fixture(t);
    const bin = join(directory, 'bin');
    mkdirSync(bin);
    for (const command of [hash, 'find', 'mkdir', 'perl', 'sed', 'sort', 'xargs']) {
      const path = execFileSync('/bin/bash', ['-c', 'command -v "$1"', '_', command], { encoding: 'utf8' }).trim();
      symlinkSync(path, join(bin, command));
    }
    const env = { PATH: bin, MATRIX_LABEL: 'fixture' };
    const assets = { 'app.zip': 'first asset\n', 'nested/second asset.exe': 'second asset\n' };
    const expected = Object.entries(assets).map(([path, content]) =>
      `${createHash('sha256').update(content).digest('hex')}  ${path}`).sort();

    for (const current of [true, false]) {
      for (const stale of [true, false]) {
        const cwd = mkdtempSync(join(directory, 'assets-'));
        const dist = join(cwd, 'desktop-dist');
        mkdirSync(join(dist, 'nested'), { recursive: true });
        for (const [path, content] of Object.entries(assets)) writeFileSync(join(dist, path), content);
        if (current) {
          writeFileSync(join(dist, 'SHA256SUMS-fixture.partial'), 'old manifest');
          mkdirSync(dirname(join(cwd, fragmentPath)), { recursive: true });
          writeFileSync(join(cwd, fragmentPath), 'old manifest');
        }
        if (stale) {
          writeFileSync(join(dist, 'nested/SHA256SUMS-previous.partial'), 'previous manifest');
          writeFileSync(join(dist, 'SHA256SUMS.txt'), 'previous consolidated manifest');
        }
        const result = bash(checksumCommand, cwd, env);
        assert.equal(result.status, 0, result.stderr);
        assert.deepEqual(readFileSync(join(cwd, fragmentPath), 'utf8').trimEnd().split('\n').sort(), expected);
      }
    }

    const empty = mkdtempSync(join(directory, 'empty-'));
    mkdirSync(join(empty, 'desktop-dist'));
    writeFileSync(join(empty, 'desktop-dist/SHA256SUMS-previous.partial'), 'previous manifest');
    assert.notEqual(bash(checksumCommand, empty, env).status, 0, 'metadata alone cannot make a release');
  });
}

test('checksum fragments are uploaded separately from desktop assets', () => {
  const assets = desktopSteps.find(({ name }) => name === 'Upload packaged assets').with.path;
  assert.match(fragmentPath, /^desktop-checksums\//);
  assert.match(assets, /^!desktop-dist\/\*\*\/\*\.partial$/m);
  assert.match(assets, /^!desktop-dist\/\*\*\/SHA256SUMS\.txt$/m);
});
