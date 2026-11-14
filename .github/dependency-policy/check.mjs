#!/usr/bin/env node
// Offline coverage policy. Dependabot performs the registry/version lookups.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDocument } from 'yaml';
import { parse as parseToml } from 'smol-toml';

export function parseYaml(text) {
  const doc = parseDocument(text, { uniqueKeys: true });
  if (doc.errors.length) throw new Error(doc.errors.map(error => error.message).join('\n'));
  return doc.toJS({ maxAliasCount: 100 });
}

// Inspect instructions only: a heredoc's contents are not Docker instructions.
export function registryImages(text) {
  const images = [];
  const stages = new Set(['scratch']);
  const lines = text.split(/\r?\n/);
  const escape = text.match(/^#\s*escape\s*=\s*([`\\])\s*$/im)?.[1] ?? '\\';
  let heredocs = [];
  for (let index = 0; index < lines.length; index++) {
    let line = lines[index].trim();
    if (heredocs.length) {
      if (line === heredocs[0]) heredocs.shift();
      continue;
    }
    if (!line || line.startsWith('#')) continue;
    const number = index + 1;
    while (line.endsWith(escape) && index + 1 < lines.length) {
      const next = lines[++index].trim();
      if (!next || next.startsWith('#')) continue;
      line = `${line.slice(0, -1)} ${next}`;
    }
    const from = line.match(/^FROM\s+(?:--platform=\S+\s+)?(\S+)(?:\s+AS\s+(\S+))?\s*$/i);
    if (/^FROM\b/i.test(line) && !from) throw new Error(`Unsupported FROM at line ${number}: ${line}`);
    if (from) {
      if (!stages.has(from[1].toLowerCase())) images.push({ image: from[1], line: number });
      if (from[2]) stages.add(from[2].toLowerCase());
    } else if (/^(?:RUN|COPY)\s/i.test(line)) {
      heredocs = [...line.matchAll(/<<-?['"]?(\w+)['"]?/g)].map(match => match[1]);
    }
  }
  return images;
}

const dependencyGroups = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];
const updatableCargoDependency = value => typeof value === 'string' ||
  (value && typeof value === 'object' && (value.version || value.git));
function cargoDependencies(manifest) {
  const groups = ['dependencies', 'dev-dependencies', 'build-dependencies'];
  return [manifest, manifest.workspace, ...Object.values(manifest.target ?? {})].filter(Boolean)
    .some(scope => groups.some(group => Object.values(scope[group] ?? {}).some(updatableCargoDependency)));
}

// Input paths come from Git, including hidden tooling directories and examples.
export function dependencySurfaces(files, read) {
  const surfaces = [];
  const add = (ecosystem, file, detail) => surfaces.push({
    ecosystem, directory: `/${posix.dirname(file) === '.' ? '' : posix.dirname(file)}`, file, detail,
  });
  for (const file of files) {
    if (/(?:^|\/)[^/]*dockerfile(?:\.[^/]*)?$/i.test(file)) {
      for (const image of registryImages(read(file))) add('docker', file, `${image.image} at line ${image.line}`);
    } else if (posix.basename(file) === 'package.json') {
      const manifest = JSON.parse(read(file));
      if (dependencyGroups.some(group => Object.keys(manifest[group] ?? {}).length)) add('npm', file);
    } else if (posix.basename(file) === 'Cargo.toml') {
      if (cargoDependencies(parseToml(read(file)))) add('cargo', file);
    } else if (/^\.github\/workflows\/[^/]+\.ya?ml$/.test(file) || /(?:^|\/)action\.ya?ml$/.test(file)) {
      const seen = new Set();
      const hasRemoteAction = value => {
        if (!value || typeof value !== 'object') return false;
        if (seen.has(value)) return false;
        seen.add(value);
        if (typeof value.uses === 'string' && !value.uses.startsWith('./') && !value.uses.startsWith('docker://')) return true;
        return Object.values(value).some(hasRemoteAction);
      };
      if (hasRemoteAction(parseYaml(read(file)))) surfaces.push({ ecosystem: 'github-actions', directory: '/', file });
    }
  }
  return surfaces;
}

export function coverageErrors(config, surfaces) {
  if (config?.version !== 2 || !Array.isArray(config.updates)) return ['Dependabot requires version: 2 and an updates array'];
  const errors = [];
  const covered = new Set();
  const configured = new Set();
  for (const update of config.updates) {
    const ecosystem = update?.['package-ecosystem'];
    const label = `Dependabot ${ecosystem}`;
    if (!['docker', 'github-actions', 'cargo', 'npm'].includes(ecosystem)) {
      errors.push(`${label}: unsupported ecosystem; extend dependency detection and tests first`);
      continue;
    }
    if (update.schedule?.interval !== 'weekly') errors.push(`${label}: require a weekly schedule`);
    if (update.cooldown?.['default-days'] !== 7) errors.push(`${label}: require a seven-day cooldown`);
    if (Object.entries(update.cooldown ?? {}).some(([key, value]) => key !== 'default-days' &&
        (!['semver-major-days', 'semver-minor-days', 'semver-patch-days'].includes(key) || !Number.isInteger(value) || value < 7))) {
      errors.push(`${label}: cooldown overrides must preserve at least seven days for every dependency`);
    }
    // Refuse settings that can make an apparently covered image unmaintained.
    for (const key of ['ignore', 'exclude-paths', 'allow', 'target-branch', 'patterns']) {
      if (Object.hasOwn(update, key)) errors.push(`${label}: ${key} requires explicit policy support`);
    }
    if (update['open-pull-requests-limit'] === 0) errors.push(`${label}: version updates are disabled`);
    if (update.directory !== undefined && update.directories !== undefined) {
      errors.push(`${label}: use directory or directories, not both`);
      continue;
    }
    const directories = update.directory !== undefined ? [update.directory] : update.directories;
    if (!Array.isArray(directories) || !directories.length) {
      errors.push(`${label}: missing directory/directories`);
      continue;
    }
    for (const directory of directories) {
      // Exact paths keep coverage auditable; add tested glob semantics if needed.
      if (typeof directory !== 'string' || !directory.startsWith('/') ||
          posix.normalize(directory) !== directory || /[\*?\[\]{}\\]/.test(directory) ||
          (directory !== '/' && directory.endsWith('/'))) {
        errors.push(`${label}: require a normalized exact directory: ${directory}`);
        continue;
      }
      const key = `${ecosystem}:${directory}`;
      if (configured.has(key)) errors.push(`${label}: duplicate directory ${directory}`);
      configured.add(key);
      const matches = surfaces.filter(surface => surface.ecosystem === ecosystem && surface.directory === directory);
      if (!matches.length) errors.push(`${label}: ${directory} has no updatable dependencies`);
      for (const match of matches) covered.add(match);
    }
  }
  for (const surface of surfaces) {
    if (!covered.has(surface)) errors.push(`Missing ${surface.ecosystem} coverage for ${surface.file}${surface.detail ? ` (${surface.detail})` : ''}; add ${surface.directory}`);
  }
  return errors;
}

export function checkRepository(root = process.cwd()) {
  root = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: root, encoding: 'utf8' }).trim();
  const files = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
  const read = file => readFileSync(resolve(root, file), 'utf8');
  const surfaces = dependencySurfaces(files, read);
  const errors = coverageErrors(parseYaml(read('.github/dependabot.yml')), surfaces);
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(`Dependabot covers ${surfaces.length} dependency surfaces`);
  return surfaces;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { checkRepository(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
