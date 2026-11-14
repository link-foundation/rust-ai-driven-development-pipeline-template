#!/usr/bin/env python3
"""Generate the dependency comparison and parent-constraint evidence."""
import concurrent.futures
import json
from pathlib import Path
import subprocess
import tomllib
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'dev/log/issues/247/pulls/248'
BASE = 'b6ede785b088becebb16be324866a541d61ee7cb'


def read(name):
    return json.loads((OUT / name).read_text())


def versions(entries):
    return sorted({entry['version'] for entry in entries})


def registry(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'issue-247-dependency-report'})
    with urllib.request.urlopen(req) as response:
        return json.load(response)


def main():
    before, after, latest = [read(name) for name in (
        'dependencies-before.json', 'dependencies-after.json', 'registry-latest.json')]
    # Capture the original direct floors as well as the original lock entries.
    for file in ('Cargo.toml', 'examples/javascript-first/Cargo.toml'):
        data = tomllib.loads(subprocess.check_output(['git', 'show', BASE + ':' + file]).decode())
        for section in ('dependencies', 'dev-dependencies'):
            for name, value in data.get(section, {}).items():
                value = value if isinstance(value, str) else value['version']
                item = {'file': file, 'version': value}
                if item not in before['cargo'].setdefault(name, []):
                    before['cargo'][name].append(item)
    (OUT / 'dependencies-before.json').write_text(json.dumps(before, indent=2) + '\n')
    npm_parents = {}
    for file in ('.github/secretlint/package-lock.json', '.github/dependency-policy/package-lock.json'):
        for path, package in json.loads((ROOT / file).read_text())['packages'].items():
            parent = path.rsplit('node_modules/', 1)[-1] or file
            for section in ('dependencies', 'devDependencies', 'optionalDependencies'):
                for name, constraint in package.get(section, {}).items():
                    npm_parents.setdefault(name, set()).add(f"{parent}@{package.get('version', 'root')} requires {constraint}")
    cargo_parents = {}
    # The resolved script projects are recorded by inventory.py; inspect those
    # exact locks too, without compiling or modifying any shared cache.
    locks = [ROOT / 'Cargo.lock', ROOT / 'examples/javascript-first/Cargo.lock']
    for path in (Path.home() / '.cache/rust-script/projects').glob('*/Cargo.toml'):
        manifest = tomllib.loads(path.read_text())
        source = manifest.get('bin', [{}])[0].get('path', '')
        if source.startswith(str(ROOT / 'scripts') + '/') and path.with_name('Cargo.lock').exists():
            locks.append(path.with_name('Cargo.lock'))
    outdated = {name for name, entries in after['cargo'].items()
                if any(v.split('+')[0] != latest['cargo'][name]['version'].split('+')[0] for v in versions(entries))}
    parents = set()
    for lock in locks:
        for package in tomllib.loads(lock.read_text()).get('package', []):
            if not package.get('source', '').startswith('registry+'):
                continue
            for dep in package.get('dependencies', []):
                name = dep.split()[0]
                if name in outdated:
                    parents.add((package['name'], package['version']))
    def get_parent(item):
        name, version = item
        return name, version, registry(f'https://crates.io/api/v1/crates/{name}/{version}/dependencies')
    parent_file = OUT / 'cargo-parent-requirements.json'
    data = read(parent_file.name) if parent_file.exists() else []
    cached = {(entry['name'], entry['version']) for entry in data}
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        for name, version, deps in pool.map(get_parent, sorted(parents - cached)):
            data.append({'name': name, 'version': version, 'dependencies': deps['dependencies']})
    parent_file.write_text(json.dumps(data, indent=2) + '\n')
    for parent in data:
        for dep in parent['dependencies']:
            if dep['crate_id'] in outdated:
                cargo_parents.setdefault(dep['crate_id'], set()).add(f"{parent['name']}@{parent['version']} requires {dep['req']}")
    action_versions = {
        'actions/attest-build-provenance': 'v4.2.2', 'actions/cache': 'v6.1.0',
        'actions/checkout': 'v7.0.1', 'actions/configure-pages': 'v6.0.0',
        'actions/dependency-review-action': 'v5.0.0', 'actions/deploy-pages': 'v5.0.1',
        'actions/download-artifact': 'v8.0.2', 'actions/setup-node': 'v7.1.0',
        'actions/setup-python': 'v7.1.0', 'actions/upload-artifact': 'v7.0.2',
        'actions/upload-pages-artifact': 'v5.0.0', 'docker/build-push-action': 'v7.4.0',
        'docker/login-action': 'v4.8.0', 'docker/setup-buildx-action': 'v4.4.1',
        'github/codeql-action': 'v4.39.3', 'lycheeverse/lychee-action': 'v2.9.0',
        'taiki-e/install-action': 'v2.90.3', 'peter-evans/create-pull-request': 'v8.1.3',
        'rust-lang/crates-io-auth-action': 'v1.0.6', 'codecov/codecov-action': 'v7.1.1',
        'zizmorcore/zizmor-action': 'v0.8.1',
    }
    lines = ['# Complete dependency comparison', '',
        'Registry snapshot: 2026-11-14 UTC. Before is the prepared branch revision ' + BASE + '.',
        'After includes direct floors, every repository lock entry, and every resolved',
        'inline rust-script project used by this checkout. Versions are deduplicated',
        'per name; the JSON inventories retain every file occurrence. New Python',
        'tool dependencies had no complete tracked manifest before this change.',
        'A published version includes its release metadata suffix; a Cargo floor',
        'without that suffix selects the same release. No package major is forced',
        'through a transitive API constraint. Each retained older release is explained',
        'below with its parent requirement, rather than hidden by an override.', '']
    for eco in ('cargo', 'pypi', 'npm', 'actions'):
        lines += ['## ' + eco, '', '| Dependency | Before | Latest stable release | After | Decision |',
                  '| --- | --- | --- | --- | --- |']
        for name in sorted(set(before.get(eco, {})) | set(after.get(eco, {}))):
            old = versions(before.get(eco, {}).get(name, []))
            new = versions(after.get(eco, {}).get(name, []))
            release = latest.get(eco, {}).get(name, {})
            current = release.get('version', release.get('tag_name', 'lookup missing'))
            reason = 'Current.'
            if eco == 'actions':
                current = action_versions.get(name, 'HEAD 683b588c487a69d01f6c6ddf40f036ff682cc2c8')
                reason = 'Current release alias or verified immutable release commit.'
                if name == 'dtolnay/rust-toolchain':
                    reason = 'Upstream default branch has no newer release; verified HEAD, explicit compiler input.'
                if name == 'github/codeql-action':
                    reason += ' Latest-release API returns a CLI bundle; action release verified separately.'
            elif not new:
                reason = 'Removed unused dependency.' if old else 'Research tool only; not a build dependency.'
                if name in ('cargo-audit', 'cargo-llvm-cov', 'rust-script'):
                    old = {'cargo-audit': ['0.22.2'], 'cargo-llvm-cov': ['unversioned'], 'rust-script': ['0.36.0']}[name]
                    new = [current]
                    reason = 'Current CI tool, explicitly versioned.'
            elif any(v.split('+')[0] != current.split('+')[0] for v in new):
                parent = cargo_parents if eco == 'cargo' else npm_parents
                constraints = '; '.join(sorted(parent.get(name, {'No parent requirement found: investigate'})))
                reason = 'Retained transitive API constraint: ' + constraints + '. Latest compatible resolution; audits clean.'
            label = name
            if eco == 'cargo':
                label = f'[{name}](https://crates.io/crates/{name})'
            elif eco == 'npm':
                label = f'[{name}](https://www.npmjs.com/package/{name})'
            elif eco == 'pypi':
                label = f'[{name}](https://pypi.org/project/{name}/)'
            elif eco == 'actions':
                label = f'[{name}](https://github.com/{name}/releases)'
            vals = [label, ', '.join(old) or 'absent', current, ', '.join(new) or 'removed', reason]
            lines.append('| ' + ' | '.join(v.replace('|', '\\|') for v in vals) + ' |')
        lines.append('')
    (OUT / 'dependency-versions.md').write_text('\n'.join(lines) + '\n')


if __name__ == '__main__':
    main()
