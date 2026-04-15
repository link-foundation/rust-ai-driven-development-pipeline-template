use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

use super::rust_paths::{get_package_manifest_path, read_package_info};

fn temp_dir(name: &str) -> PathBuf {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let path = std::env::temp_dir().join(format!("rust-paths-{name}-{nanos}"));
    fs::create_dir_all(&path).unwrap();
    path
}

#[test]
fn resolves_root_package_manifest_when_package_exists() {
    let repo = temp_dir("root-package");
    fs::write(
        repo.join("Cargo.toml"),
        r#"[package]
name = "root-crate"
version = "1.2.3"
"#,
    )
    .unwrap();

    let manifest = get_package_manifest_path(&repo.join("Cargo.toml")).unwrap();
    let info = read_package_info(&manifest).unwrap();

    assert_eq!(manifest, repo.join("Cargo.toml"));
    assert_eq!(info.name, "root-crate");
    assert_eq!(info.version, "1.2.3");
}

#[test]
fn resolves_first_publishable_workspace_member() {
    let repo = temp_dir("workspace-member");
    fs::create_dir_all(repo.join("private-crate")).unwrap();
    fs::create_dir_all(repo.join("public-crate")).unwrap();

    fs::write(
        repo.join("Cargo.toml"),
        r#"[workspace]
members = ["private-crate", "public-crate"]
resolver = "2"
"#,
    )
    .unwrap();

    fs::write(
        repo.join("private-crate/Cargo.toml"),
        r#"[package]
name = "private-crate"
version = "0.1.0"
publish = false
"#,
    )
    .unwrap();

    fs::write(
        repo.join("public-crate/Cargo.toml"),
        r#"[package]
name = "public-crate"
version = "0.2.0"
"#,
    )
    .unwrap();

    let manifest = get_package_manifest_path(&repo.join("Cargo.toml")).unwrap();
    let info = read_package_info(&manifest).unwrap();

    assert_eq!(manifest, repo.join("public-crate/Cargo.toml"));
    assert_eq!(info.name, "public-crate");
    assert_eq!(info.version, "0.2.0");
}

#[test]
fn errors_when_workspace_has_no_publishable_members() {
    let repo = temp_dir("no-publishable-members");
    fs::create_dir_all(repo.join("private-crate")).unwrap();

    fs::write(
        repo.join("Cargo.toml"),
        r#"[workspace]
members = ["private-crate"]
"#,
    )
    .unwrap();

    fs::write(
        repo.join("private-crate/Cargo.toml"),
        r#"[package]
name = "private-crate"
version = "0.1.0"
publish = false
"#,
    )
    .unwrap();

    let error = get_package_manifest_path(&repo.join("Cargo.toml")).unwrap_err();
    assert!(error.contains("No publishable workspace members"));
}
