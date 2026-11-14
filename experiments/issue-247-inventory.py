#!/usr/bin/env python3
"""Capture live registry versions for all active dependencies without a build."""
import concurrent.futures
import json
from pathlib import Path
import re
import subprocess
import sys
import tomllib
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'dev/log/issues/247/pulls/248'


def get(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'issue-247-dependency-inventory'})
    with urllib.request.urlopen(request) as response:
        return json.load(response)


def capture():
    files = subprocess.check_output(['git', 'ls-files', '-z'], cwd=ROOT).decode().split('\0')
    crates = {}
    npm = {}
    actions = {}
    for file in filter(None, files):
        path = ROOT / file
        if file.endswith('Cargo.lock'):
            for package in tomllib.loads(path.read_text())['package']:
                if package.get('source', '').startswith('registry+'):
                    crates.setdefault(package['name'], []).append({'file': file, 'version': package['version']})
        elif file.endswith('package-lock.json'):
            for name, package in json.loads(path.read_text())['packages'].items():
                if name:
                    npm.setdefault(name.rsplit('node_modules/', 1)[-1], []).append({'file': file, 'version': package['version']})
        elif file.startswith('scripts/') and file.endswith('.rs'):
            match = re.search(r'//! ```cargo\n(.*?)//! ```', path.read_text(), re.S)
            if match:
                manifest = tomllib.loads(re.sub(r'^//! ?', '', match[1], flags=re.M))
                for name, value in manifest.get('dependencies', {}).items():
                    crates.setdefault(name, []).append({'file': file, 'version': value if isinstance(value, str) else value['version']})
        elif (file.startswith('.github/workflows/') or file.endswith('/action.yml')) and file.endswith(('.yml', '.yaml')):
            for action, ref in re.findall(r'uses:\s+([\w-]+/[\w.-]+)(?:/[\w/-]+)?@([^\s#]+)', path.read_text()):
                actions.setdefault(action, []).append({'file': file, 'version': ref})
    for name in ('cargo-audit', 'cargo-llvm-cov', 'rust-script', 'cargo-edit'):
        crates.setdefault(name, [])
    python = {}
    requirements = ROOT / 'requirements-dev.txt'
    if requirements.exists():
        for name, version in re.findall(r'^([\w.-]+)==([^\s;\\]+)', requirements.read_text(), re.M):
            python[name] = [{'file': 'requirements-dev.txt', 'version': version}]
    for path in ROOT.rglob('Cargo.toml'):
        if 'target' in path.parts:
            continue
        manifest = tomllib.loads(path.read_text())
        for section in ('dependencies', 'dev-dependencies', 'build-dependencies'):
            for name, value in manifest.get(section, {}).items():
                version = value if isinstance(value, str) else value.get('version')
                if version:
                    crates.setdefault(name, []).append({'file': str(path.relative_to(ROOT)), 'version': version})
    # rust-script uses generated Cargo projects rather than repository lockfiles.
    # Include only cache projects whose current inline manifest matches this checkout.
    cache = Path.home() / '.cache/rust-script/projects'
    for path in cache.glob('*/Cargo.toml'):
        manifest = tomllib.loads(path.read_text())
        source = Path(manifest.get('bin', [{}])[0].get('path', ''))
        if not source.is_relative_to(ROOT / 'scripts') or not source.exists():
            continue
        match = re.search(r'//! ```cargo\n(.*?)//! ```', source.read_text(), re.S)
        if not match:
            continue
        expected = tomllib.loads(re.sub(r'^//! ?', '', match[1], flags=re.M)).get('dependencies', {})
        def versions(deps):
            return {name: value if isinstance(value, str) else value.get('version') for name, value in deps.items()}
        if versions(manifest.get('dependencies', {})) != versions(expected):
            continue
        lock = path.with_name('Cargo.lock')
        if lock.exists():
            for package in tomllib.loads(lock.read_text())['package']:
                if package.get('source', '').startswith('registry+'):
                    crates.setdefault(package['name'], []).append({'file': str(source.relative_to(ROOT)) + ' (resolved)', 'version': package['version']})
    before = {'cargo': crates, 'npm': npm, 'actions': actions, 'pypi': python}
    baseline = OUT / 'dependencies-before.json'
    if not baseline.exists():
        baseline.write_text(json.dumps(before, indent=2) + '\n')
    (OUT / 'dependencies-after.json').write_text(json.dumps(before, indent=2) + '\n')
    if '--capture-only' in sys.argv:
        return
    latest = {}

    def lookup(item):
        ecosystem, name = item
        if ecosystem == 'cargo':
            data = get(f'https://crates.io/api/v1/crates/{name}')
            version = data['crate']['max_stable_version']
            package = next(v for v in data['versions'] if v['num'] == version)
            result = {'version': version, 'repository': data['crate']['repository'], 'rust_version': package.get('rust_version'), 'created_at': package['created_at']}
        elif ecosystem == 'npm':
            data = get(f'https://registry.npmjs.org/{urllib.parse.quote(name, safe="")}/latest')
            result = {key: data.get(key) for key in ('version', 'engines', 'repository')}
        elif ecosystem == 'pypi':
            data = get(f'https://pypi.org/pypi/{name}/json')
            result = {key: data['info'].get(key) for key in ('version', 'requires_python', 'requires_dist', 'project_urls')}
        else:
            data = json.loads(subprocess.check_output(['gh', 'api', f'repos/{name}/releases/latest']))
            result = {key: data.get(key) for key in ('tag_name', 'published_at', 'html_url', 'body')}
        return ecosystem, name, result

    initial = json.loads(baseline.read_text())
    items = [(eco, name) for eco in before for name in set(before[eco]) | set(initial.get(eco, {}))]
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        futures = {pool.submit(lookup, item): item for item in items}
        for future in concurrent.futures.as_completed(futures):
            eco, name = futures[future]
            try:
                _, _, result = future.result()
            except Exception as error:
                result = {'error': str(error)}
            latest.setdefault(eco, {})[name] = result
    for name in ('pre-commit', 'pre-commit-hooks', 'shellcheck-py', 'zizmor', 'pip-audit'):
        data = get(f'https://pypi.org/pypi/{name}/json')
        latest.setdefault('pypi', {})[name] = {key: data['info'].get(key) for key in ('version', 'requires_python', 'requires_dist', 'project_urls')}
    latest['node'] = get('https://nodejs.org/dist/index.json')[:3]
    (OUT / 'registry-latest.json').write_text(json.dumps(latest, indent=2) + '\n')
    print(json.dumps({eco: {name: data.get('version', data.get('tag_name', data.get('error'))) for name, data in packages.items()} for eco, packages in latest.items() if eco != 'node'}, indent=2))


if __name__ == '__main__':
    capture()
