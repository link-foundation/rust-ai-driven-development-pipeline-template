import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import YAML from '../.github/dependency-policy/node_modules/yaml/dist/index.js';

const action = YAML.parse(readFileSync(new URL('../.github/actions/setup-buildx-resilient/action.yml', import.meta.url), 'utf8'));
const [canonical, notice, mirror] = action.runs.steps;
const image = action.inputs['buildkit-image'].default;

// Mock the remote action's result; execute the actual intervening shell block.
function setup(canonicalWorks, mirrorWorks, registry = 'mirror.gcr.io') {
  const pulls = [image];
  if (canonicalWorks) return { status: 0, pulls };
  const result = spawnSync('bash', ['-c', notice.run], {
    env: { ...process.env, BUILDKIT_IMAGE: image, REGISTRY_MIRROR: registry, VERBOSE: 'false' },
    encoding: 'utf8',
  });
  if (result.status !== 0) return { status: result.status, pulls };
  pulls.push(`${registry}/${image}`);
  return { status: mirrorWorks ? 0 : 1, pulls };
}

test('canonical success skips the mirror', () => {
  assert.deepEqual(setup(true, false), { status: 0, pulls: [image] });
});
test('canonical outage recovers through the independent mirror', () => {
  assert.deepEqual(setup(false, true), { status: 0, pulls: [image, `mirror.gcr.io/${image}`] });
});
test('both registries failing is fatal; disabled mirrors never hide failure', () => {
  assert.equal(setup(false, false).status, 1);
  assert.deepEqual(setup(false, true, ''), { status: 1, pulls: [image] });
});
test('real composite wiring delegates both pulls to the official action', () => {
  assert.equal(canonical.uses, 'docker/setup-buildx-action@v4');
  assert.equal(canonical['continue-on-error'], true);
  assert.equal(canonical.id, 'canonical');
  assert.equal(canonical.with['driver-opts'], 'image=${{ inputs.buildkit-image }}');
  assert.equal(notice.if, "steps.canonical.outcome == 'failure'");
  assert.equal(mirror.if, "steps.canonical.outcome == 'failure' && inputs.registry-mirror != ''");
  assert.equal(mirror.uses, canonical.uses);
  assert.equal(mirror.with['driver-opts'], 'image=${{ inputs.registry-mirror }}/${{ inputs.buildkit-image }}');
  assert.match(notice.run, /RUNNER_DEBUG/);
  assert.match(notice.run, /set -x/);
  assert.doesNotMatch(notice.run, /docker (pull|tag)|sleep/);
});
