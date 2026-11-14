import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { checkRepository, coverageErrors, dependencySurfaces, parseYaml, registryImages } from './check.mjs';

const update = (ecosystem, directory) => ({
  'package-ecosystem': ecosystem, directory,
  schedule: { interval: 'weekly' }, cooldown: { 'default-days': 7 },
});
const config = (...updates) => ({ version: 2, updates });
const detect = files => dependencySurfaces(Object.keys(files), file => files[file]);
const source = { 'examples/javascript-first/Dockerfile': 'FROM rust:1.96.0-slim@sha256:old AS build\n' };

test('original missing Docker coverage fails and the exact directory fixes it', () => {
  const surfaces = detect(source);
  assert.match(coverageErrors(config(), surfaces).join('\n'), /Missing docker coverage.*rust:1\.96\.0-slim/);
  assert.deepEqual(coverageErrors(config(update('docker', '/examples/javascript-first')), surfaces), []);
  const wrongRoot = coverageErrors(config(update('docker', '/')), surfaces);
  assert.match(wrongRoot.join('\n'), /no updatable dependencies/);
  assert.match(wrongRoot.join('\n'), /Missing docker coverage/);
});

test('new Dockerfiles and every registry FROM need their own directory covered', () => {
  const surfaces = detect({
    ...source, 'services/api/Dockerfile.release': 'FROM node:24 AS build\nFROM debian:stable\n',
    'services/worker/worker.dockerfile': 'from alpine:3\n',
  });
  const cfg = config(update('docker', '/examples/javascript-first'));
  assert.equal(coverageErrors(cfg, surfaces).filter(error => error.startsWith('Missing')).length, 3);
  const multi = update('docker');
  delete multi.directory;
  multi.directories = ['/examples/javascript-first', '/services/api', '/services/worker'];
  assert.deepEqual(coverageErrors(config(multi), surfaces), []);
});

test('Docker stages, scratch, case, platform, continuations and ARG images are classified', () => {
  const images = registryImages([
    '# FROM ignored:1', 'ARG BASE=rust:1.100.0',
    'FROM --platform=$BUILDPLATFORM ${BASE} AS Builder',
    'from builder AS copy', 'FROM scratch',
    'FROM \\', '  --platform=linux/amd64 \\', '# comment inside continuation',
    '  ghcr.io/org/runtime:1@sha256:abc AS final',
  ].join('\n'));
  assert.deepEqual(images.map(record => record.image), ['${BASE}', 'ghcr.io/org/runtime:1@sha256:abc']);
  assert.equal(images[1].line, 6);
  assert.deepEqual(registryImages('# escape=`\nFROM `\n alpine:3 AS stage\nFROM stage'), [{ image: 'alpine:3', line: 2 }]);
  assert.throws(() => registryImages('FROM --unsupported flag image'), /Unsupported FROM/);
});

test('heredoc contents do not become phantom registry images', () => {
  assert.deepEqual(registryImages('FROM scratch\nCOPY <<EOF /file\nFROM fake:1\nEOF\n'), []);
  assert.deepEqual(registryImages('FROM scratch\nRUN <<-"A" <<\'B\'\nFROM fake:1\nA\nFROM fake:2\nB\n'), []);
});

test('each populated ecosystem is required, while empty and local-only projects need no entry', () => {
  const surfaces = detect({
    'Cargo.toml': '[workspace.dependencies]\nserde = "1"\n',
    'nested/Cargo.toml': '[target.\'cfg(unix)\'.build-dependencies]\nhelper = { git = "https://example.com/helper" }\n',
    'local/Cargo.toml': '[dependencies]\nhelper = { path = "../helper" }\n',
    'empty/Cargo.toml': '[package]\nname = "empty"\nversion = "0.1.0"\n',
    'tools/package.json': '{"devDependencies":{"yaml":"2.9.1"}}',
    'peer/package.json': '{"peerDependencies":{"node":"*"}}',
    'empty/package.json': '{"scripts":{"test":"node --test"}}',
    '.github/workflows/ci.yml': 'jobs:\n  test:\n    steps:\n      - uses: actions/checkout@v7\n',
    '.github/actions/helper/action.yml': 'runs:\n  steps:\n    - uses: org/action@sha\n',
  });
  assert.deepEqual(surfaces.map(({ ecosystem, directory }) => [ecosystem, directory]), [
    ['cargo', '/'], ['cargo', '/nested'], ['npm', '/tools'], ['npm', '/peer'],
    ['github-actions', '/'], ['github-actions', '/'],
  ]);
  assert.equal(coverageErrors(config(), surfaces).length, 6);
  assert.deepEqual(coverageErrors(config(update('cargo', '/'), update('cargo', '/nested'),
    update('npm', '/tools'), update('npm', '/peer'), update('github-actions', '/')), surfaces), []);
  for (const ecosystem of ['cargo', 'npm', 'docker', 'github-actions']) {
    assert.match(coverageErrors(config(update(ecosystem, '/empty')), surfaces).join('\n'), /no updatable dependencies/);
  }
  assert.deepEqual(detect({ 'Dockerfile': 'FROM scratch\n', '.github/workflows/local.yml': 'jobs:\n  test:\n    uses: ./.github/workflows/reusable.yml\n' }), []);
});

test('malformed configuration and bypasses fail closed', () => {
  const surfaces = detect(source);
  assert.throws(() => parseYaml('updates: []\nupdates: []\n'), /unique/);
  assert.throws(() => parseYaml('updates: [\n'), /flow sequence/i);
  assert.ok(coverageErrors({}, surfaces).length);
  for (const change of [
    { schedule: { interval: 'daily' } }, { cooldown: {} }, { cooldown: { 'default-days': 7, exclude: ['*'] } },
    { cooldown: { 'default-days': 7, 'semver-patch-days': 0 } },
    { 'open-pull-requests-limit': 0 }, { ignore: [{ 'dependency-name': '*' }] },
    { 'exclude-paths': ['Dockerfile'] }, { 'target-branch': 'other' },
    { directory: '/examples/../examples/javascript-first' }, { directory: '/**' },
    { directories: ['/examples/javascript-first'] },
  ]) {
    assert.ok(coverageErrors(config({ ...update('docker', '/examples/javascript-first'), ...change }), surfaces).length, JSON.stringify(change));
  }
  assert.match(coverageErrors(config(update('terraform', '/')), []).join('\n'), /unsupported ecosystem/);
  assert.match(coverageErrors(config(update('docker', '/examples/javascript-first'), update('docker', '/examples/javascript-first')), surfaces).join('\n'), /duplicate/);
});

test('real Git inventory and CLI enforce missing config and new hidden/nested files', { timeout: 10000 }, t => {
  const root = mkdtempSync(join(tmpdir(), 'dependabot-239-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  execFileSync('git', ['init', '-q'], { cwd: root });
  const write = (file, content) => {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    writeFileSync(join(root, file), content);
    execFileSync('git', ['add', '--', file], { cwd: root });
  };
  write('Dockerfile', 'FROM rust:1.96.0-slim\n');
  assert.throws(() => checkRepository(root), /ENOENT/);
  write('.github/dependabot.yml', JSON.stringify(config(update('docker', '/'))));
  assert.equal(checkRepository(root).length, 1);
  write('.hidden/new/Dockerfile', 'FROM alpine:3\n');
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('./check.mjs', import.meta.url))], {
    cwd: root, encoding: 'utf8', timeout: 5000,
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Missing docker coverage for \.hidden\/new\/Dockerfile/);
});

test('repository config covers only real dependencies and CI always executes the guard', () => {
  assert.ok(checkRepository().some(surface => surface.file === 'examples/javascript-first/Dockerfile'));
  const workflow = parseYaml(readFileSync(new URL('../workflows/release.yml', import.meta.url), 'utf8'));
  const job = workflow.jobs['secrets-scan'];
  assert.ok(job.needs.includes('javascript-first'));
  assert.match(job.if, /tested-sha == github.sha/);
  const runs = job.steps.map(step => step.run).filter(Boolean);
  assert.ok(runs.includes('npm ci --prefix .github/dependency-policy --ignore-scripts --no-audit --no-fund'));
  assert.ok(runs.includes('node --test .github/dependency-policy/check.test.mjs'));
  assert.ok(runs.includes('node .github/dependency-policy/check.mjs'));
  assert.ok(workflow.jobs['pipeline-status'].needs.includes('secrets-scan'));
  assert.equal(workflow.on.pull_request.paths, undefined);
});


test('Python tools, remote pre-commit hooks and pinned Rust toolchains require coverage', () => {
  const surfaces = detect({
    'requirements-dev.in': '# tools\nzizmor==1.32.0\n',
    'requirements-dev.txt': '# locked\nzizmor==1.32.0 \\n    --hash=sha256:abc\n',
    'empty/requirements.txt': '# no third-party packages\n',
    '.pre-commit-config.yaml': 'repos:\n  - repo: https://github.com/pre-commit/pre-commit-hooks\n    rev: v6.0.0\n',
    'local/.pre-commit-config.yaml': 'repos:\n  - repo: local\n',
    'rust-toolchain.toml': '[toolchain]\nchannel = "1.100.0"\n',
  });
  assert.deepEqual(surfaces.map(({ ecosystem }) => ecosystem), ['pip', 'pip', 'pre-commit', 'rust-toolchain']);
  assert.equal(coverageErrors(config(), surfaces).length, 4);
  assert.deepEqual(coverageErrors(config(update('pip', '/'), update('pre-commit', '/'), update('rust-toolchain', '/')), surfaces), []);
  for (const ecosystem of ['pip', 'pre-commit', 'rust-toolchain']) {
    assert.match(coverageErrors(config(update(ecosystem, '/empty')), surfaces).join('\n'), /no updatable dependencies/);
  }
});
