//! Compare committed trees, allowing only dependency-equivalent release metadata.
use std::collections::BTreeMap;
use std::path::Path;

use super::exec;

type Tree = BTreeMap<String, (String, String)>;

fn tree(revision: &str) -> Result<Tree, String> {
    let result = std::process::Command::new("git")
        .args(["ls-tree", "-r", "-z", revision])
        .output()
        .map_err(|e| e.to_string())?;
    if !result.status.success() {
        return Err(String::from_utf8_lossy(&result.stderr).into_owned());
    }
    let output = String::from_utf8(result.stdout).map_err(|e| e.to_string())?;
    output
        .split('\0')
        .filter(|entry| !entry.is_empty())
        .map(|entry| {
            let (metadata, path) = entry.split_once('\t').ok_or("Invalid Git tree entry")?;
            let parts: Vec<_> = metadata.split_whitespace().collect();
            if parts.len() != 3 {
                return Err("Invalid Git tree metadata".to_string());
            }
            Ok((
                path.to_string(),
                (parts[0].to_string(), parts[2].to_string()),
            ))
        })
        .collect()
}

fn content(blob: &str) -> Result<String, String> {
    exec("git", &["cat-file", "blob", blob])
}

fn toml(blob: &str) -> Result<toml::Value, String> {
    content(blob)?
        .parse::<toml::Value>()
        .map_err(|e| e.to_string())
}

fn json(blob: &str) -> Result<serde_json::Value, String> {
    serde_json::from_str(&content(blob)?).map_err(|e| e.to_string())
}

fn strip_toml_version(value: &mut toml::Value, section: &[&str]) {
    let mut current = value;
    for key in section {
        let Some(next) = current.get_mut(*key) else {
            return;
        };
        current = next;
    }
    if let Some(table) = current.as_table_mut() {
        // An inherited version table is behavior, not a scalar release version.
        if table.get("version").is_some_and(toml::Value::is_str) {
            table.insert(
                "version".into(),
                toml::Value::String("<release-version>".into()),
            );
        }
    }
}

/// Versions of local packages only; registry packages of the same name retain
/// their version, source and checksum in the lock comparison.
fn local_versions(tree: &Tree) -> Result<BTreeMap<(String, String), ()>, String> {
    let mut packages = BTreeMap::new();
    for (path, (mode, blob)) in tree {
        if Path::new(path)
            .file_name()
            .is_some_and(|p| p == "Cargo.toml")
        {
            if mode != "100644" {
                return Err(format!("Non-regular manifest: {path}"));
            }
            let manifest = toml(blob)?;
            let Some(package) = manifest.get("package") else {
                continue;
            };
            let Some(name) = package.get("name").and_then(toml::Value::as_str) else {
                continue;
            };
            let version = package
                .get("version")
                .and_then(toml::Value::as_str)
                .map(str::to_string)
                .or_else(|| {
                    if package
                        .get("version")
                        .and_then(|v| v.get("workspace"))
                        .and_then(toml::Value::as_bool)
                        != Some(true)
                    {
                        return None;
                    }
                    Path::new(path).ancestors().skip(2).find_map(|parent| {
                        let workspace = parent
                            .join("Cargo.toml")
                            .to_string_lossy()
                            .replace('\\', "/");
                        let (_, blob) = tree.get(&workspace)?;
                        let manifest = toml(blob).ok()?;
                        manifest
                            .get("workspace")?
                            .get("package")?
                            .get("version")?
                            .as_str()
                            .map(str::to_string)
                    })
                });
            if let Some(version) = version {
                packages.insert((name.to_string(), version.to_string()), ());
            }
        }
    }
    Ok(packages)
}

fn normalized_lock(blob: &str, tree: &Tree) -> Result<toml::Value, String> {
    let versions = local_versions(tree)?;
    let mut lock = toml(blob)?;
    if let Some(packages) = lock.get_mut("package").and_then(toml::Value::as_array_mut) {
        for package in packages {
            let name = package
                .get("name")
                .and_then(toml::Value::as_str)
                .unwrap_or("");
            let version = package
                .get("version")
                .and_then(toml::Value::as_str)
                .unwrap_or("");
            if package.get("source").is_none()
                && package.get("checksum").is_none()
                && versions.contains_key(&(name.to_string(), version.to_string()))
            {
                strip_toml_version(package, &[]);
            }
        }
    }
    Ok(lock)
}

fn metadata_equivalent(
    path: &str,
    before: &str,
    after: &str,
    base: &Tree,
    candidate: &Tree,
) -> Result<bool, String> {
    match Path::new(path).file_name().and_then(|p| p.to_str()) {
        Some("Cargo.toml") => {
            let (mut a, mut b) = (toml(before)?, toml(after)?);
            for value in [&mut a, &mut b] {
                strip_toml_version(value, &["package"]);
                strip_toml_version(value, &["workspace", "package"]);
            }
            Ok(a == b)
        }
        Some("Cargo.lock") => {
            Ok(normalized_lock(before, base)? == normalized_lock(after, candidate)?)
        }
        Some("package.json" | "package-lock.json") => {
            let (mut a, mut b) = (json(before)?, json(after)?);
            for value in [&mut a, &mut b] {
                if let Some(object) = value.as_object_mut() {
                    if object
                        .get("version")
                        .is_some_and(serde_json::Value::is_string)
                    {
                        object.insert(
                            "version".into(),
                            serde_json::Value::String("<release-version>".into()),
                        );
                    }
                }
                if path.ends_with("package-lock.json") {
                    if let Some(root) = value
                        .pointer_mut("/packages/")
                        .and_then(serde_json::Value::as_object_mut)
                    {
                        if root
                            .get("version")
                            .is_some_and(serde_json::Value::is_string)
                        {
                            root.insert(
                                "version".into(),
                                serde_json::Value::String("<release-version>".into()),
                            );
                        }
                    }
                }
            }
            Ok(a == b)
        }
        _ => Ok(false),
    }
}

/// Scope only independent language roots. Root-level files and shared tooling
/// remain protected. External Cargo paths or symlinks require repository-wide
/// validation because a sibling may be an input to the Rust build.
fn independent_root(root: &Path, base: &Tree, next: &Tree) -> Result<bool, String> {
    if root.as_os_str().is_empty() || root == Path::new(".") {
        return Ok(false);
    }
    // A parent workspace can supply shared dependencies/build configuration.
    if root.ancestors().skip(1).any(|parent| {
        let manifest = parent
            .join("Cargo.toml")
            .to_string_lossy()
            .replace('\\', "/");
        base.contains_key(&manifest) || next.contains_key(&manifest)
    }) {
        return Ok(false);
    }
    for tree in [base, next] {
        for (path, (mode, blob)) in tree {
            if !Path::new(path).starts_with(root) {
                continue;
            }
            if mode == "120000" {
                return Ok(false);
            }
            if Path::new(path)
                .file_name()
                .is_some_and(|p| p == "Cargo.toml")
                && has_external_path(&toml(blob)?)
            {
                return Ok(false);
            }
        }
    }
    Ok(true)
}

fn has_external_path(value: &toml::Value) -> bool {
    match value {
        toml::Value::Table(table) => table.iter().any(|(key, value)| {
            (matches!(key.as_str(), "path" | "members" | "exclude" | "build")
                && (value.to_string().contains("..")
                    || value.as_str().is_some_and(|p| Path::new(p).is_absolute())))
                || has_external_path(value)
        }),
        toml::Value::Array(array) => array.iter().any(has_external_path),
        _ => false,
    }
}

fn unrelated_sibling(path: &str, root: &Path) -> bool {
    let file = Path::new(path);
    let Some(top) = file.components().next() else {
        return false;
    };
    let name = top.as_os_str().to_string_lossy();
    file.components().count() > 1
        && !file.starts_with(root)
        && !root.starts_with(Path::new(top.as_os_str()))
        && !name.starts_with('.')
        && !matches!(
            name.as_ref(),
            "scripts"
                | "tests"
                | "fixtures"
                | "examples"
                | "experiments"
                | "docs"
                | "vendor"
                | "node_modules"
                | "src"
                | "lib"
                | "changelog.d"
        )
}

/// Prove that candidate preserves the validated tree, apart from explicitly
/// allowed metadata. New manifests/locks, symlinks and fragment edits fail closed.
fn equivalent(validated: &str, candidate: &str, rust_root: &Path) -> Result<(), String> {
    let base = tree(validated)?;
    let next = tree(candidate)?;
    let scoped = independent_root(rust_root, &base, &next)?;
    for path in base.keys().chain(next.keys()) {
        let before = base.get(path);
        let after = next.get(path);
        if before == after {
            continue;
        }
        if scoped && unrelated_sibling(path, rust_root) {
            continue;
        }
        // Changesets consumes root-level fragments on sibling JS releases.
        // Only deletion of existing regular fragments is release metadata.
        if Path::new(path).parent() == Some(Path::new(".changeset"))
            && path.ends_with(".md")
            && !path.ends_with("/README.md")
            && before.is_some_and(|(mode, _)| mode == "100644")
            && after.is_none()
        {
            continue;
        }
        if before
            .into_iter()
            .chain(after)
            .any(|(mode, _)| mode != "100644")
        {
            return Err(format!("Unexpected release metadata mode: {path}"));
        }
        let file = Path::new(path);
        if file.components().any(|part| {
            let name = part.as_os_str().to_string_lossy();
            name.starts_with('.')
                || matches!(
                    name.as_ref(),
                    "tests"
                        | "fixtures"
                        | "examples"
                        | "experiments"
                        | "docs"
                        | "scripts"
                        | "vendor"
                        | "node_modules"
                )
        }) {
            return Err(format!("Path outside release metadata allowlist: {path}"));
        }
        let fragment = file
            .parent()
            .and_then(Path::file_name)
            .is_some_and(|p| p == "changelog.d")
            && file.extension().is_some_and(|p| p == "md")
            && file.file_name().is_some_and(|p| p != "README.md");
        if fragment && after.is_none() {
            continue;
        }
        if file.file_name().is_some_and(|p| p == "CHANGELOG.md") && after.is_some() {
            continue;
        }
        if let (Some((_, a)), Some((_, b))) = (before, after) {
            if metadata_equivalent(path, a, b, &base, &next)? {
                continue;
            }
        }
        return Err(format!("Untested source/dependency change: {path}"));
    }
    Ok(())
}

pub fn verify(validated: &str, candidate: &str, rust_root: &str) -> Result<(), String> {
    let repository = std::fs::canonicalize(exec("git", &["rev-parse", "--show-toplevel"])?)
        .map_err(|e| e.to_string())?;
    let root = std::fs::canonicalize(rust_root).map_err(|e| e.to_string())?;
    let root = root.strip_prefix(repository).map_err(|e| e.to_string())?;
    exec("git", &["merge-base", "--is-ancestor", validated, candidate])
        .and_then(|_| equivalent(validated, candidate, root))
        .map_err(|e| format!("Release cannot preserve validated source {validated} at {candidate}: {e}. Let the newer commit's own CI run release it."))
}
