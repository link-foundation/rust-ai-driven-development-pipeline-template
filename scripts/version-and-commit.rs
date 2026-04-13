#!/usr/bin/env rust-script
//! Bump version in Cargo.toml and commit changes
//! Used by the CI/CD pipeline for releases
//!
//! IMPORTANT: This script checks crates.io (the source of truth for Rust packages),
//! NOT git tags. This is critical because:
//! - Git tags can exist without the package being published
//! - GitHub releases create tags but don't publish to crates.io
//! - Only crates.io publication means users can actually install the package
//!
//! Supports both single-language and multi-language repository structures:
//! - Single-language: Cargo.toml and changelog.d/ in repository root
//! - Multi-language: Cargo.toml and changelog.d/ in rust/ subfolder
//!
//! Usage: rust-script scripts/version-and-commit.rs --bump-type <major|minor|patch> [--description <desc>] [--rust-root <path>]
//!
//! ```cargo
//! [dependencies]
//! regex = "1"
//! chrono = "0.4"
//! ureq = "2"
//! serde = { version = "1", features = ["derive"] }
//! serde_json = "1"
//! ```

use std::env;
use std::fs;
use std::io::Write;
use std::path::Path;
use std::process::{Command, exit};
use regex::Regex;
use chrono::Utc;
use serde::Deserialize;

fn get_arg(name: &str) -> Option<String> {
    let args: Vec<String> = env::args().collect();
    let flag = format!("--{}", name);

    if let Some(idx) = args.iter().position(|a| a == &flag) {
        return args.get(idx + 1).cloned();
    }

    let env_name = name.to_uppercase().replace('-', "_");
    env::var(&env_name).ok().filter(|s| !s.is_empty())
}

fn get_rust_root() -> String {
    if let Some(root) = get_arg("rust-root") {
        eprintln!("Using explicitly configured Rust root: {}", root);
        return root;
    }

    if Path::new("./Cargo.toml").exists() {
        eprintln!("Detected single-language repository (Cargo.toml in root)");
        return ".".to_string();
    }

    if Path::new("./rust/Cargo.toml").exists() {
        eprintln!("Detected multi-language repository (Cargo.toml in rust/)");
        return "rust".to_string();
    }

    eprintln!("Error: Could not find Cargo.toml in expected locations");
    exit(1);
}

fn get_cargo_toml_path(rust_root: &str) -> String {
    if rust_root == "." {
        "./Cargo.toml".to_string()
    } else {
        format!("{}/Cargo.toml", rust_root)
    }
}

fn get_changelog_dir(rust_root: &str) -> String {
    if rust_root == "." {
        "./changelog.d".to_string()
    } else {
        format!("{}/changelog.d", rust_root)
    }
}

fn get_changelog_path(rust_root: &str) -> String {
    if rust_root == "." {
        "./CHANGELOG.md".to_string()
    } else {
        format!("{}/CHANGELOG.md", rust_root)
    }
}

fn set_output(key: &str, value: &str) {
    if let Ok(output_file) = env::var("GITHUB_OUTPUT") {
        if let Ok(mut file) = fs::OpenOptions::new().create(true).append(true).open(&output_file) {
            let _ = writeln!(file, "{}={}", key, value);
        }
    }
    println!("Output: {}={}", key, value);
}

fn exec(command: &str, args: &[&str]) -> Result<String, String> {
    match Command::new(command).args(args).output() {
        Ok(output) => {
            if output.status.success() {
                Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr);
                Err(format!("Command failed: {}", stderr))
            }
        }
        Err(e) => Err(format!("Failed to execute: {}", e)),
    }
}

fn exec_check(command: &str, args: &[&str]) -> bool {
    Command::new(command)
        .args(args)
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

struct Version {
    major: u32,
    minor: u32,
    patch: u32,
}

impl Version {
    fn parse(content: &str) -> Option<Version> {
        let re = Regex::new(r#"(?m)^version\s*=\s*"(\d+)\.(\d+)\.(\d+)""#).ok()?;
        let caps = re.captures(content)?;
        Some(Version {
            major: caps.get(1)?.as_str().parse().ok()?,
            minor: caps.get(2)?.as_str().parse().ok()?,
            patch: caps.get(3)?.as_str().parse().ok()?,
        })
    }

    fn bump(&self, bump_type: &str) -> String {
        match bump_type {
            "major" => format!("{}.0.0", self.major + 1),
            "minor" => format!("{}.{}.0", self.major, self.minor + 1),
            _ => format!("{}.{}.{}", self.major, self.minor, self.patch + 1),
        }
    }
}

fn update_cargo_toml(cargo_toml_path: &str, new_version: &str) -> Result<(), String> {
    let content = fs::read_to_string(cargo_toml_path)
        .map_err(|e| format!("Failed to read {}: {}", cargo_toml_path, e))?;

    let re = Regex::new(r#"(?m)^(version\s*=\s*")[^"]+(")"#).unwrap();
    let new_content = re.replace(&content, format!("${{1}}{}${{2}}", new_version).as_str());

    fs::write(cargo_toml_path, new_content.as_ref())
        .map_err(|e| format!("Failed to write {}: {}", cargo_toml_path, e))?;

    println!("Updated {} to version {}", cargo_toml_path, new_version);
    Ok(())
}

#[derive(Deserialize)]
struct CratesIoVersion {
    version: Option<CratesIoVersionInfo>,
}

#[derive(Deserialize)]
struct CratesIoVersionInfo {
    #[allow(dead_code)]
    num: String,
}

fn get_crate_name(cargo_toml_path: &str) -> Result<String, String> {
    let content = fs::read_to_string(cargo_toml_path)
        .map_err(|e| format!("Failed to read {}: {}", cargo_toml_path, e))?;

    let re = Regex::new(r#"(?m)^name\s*=\s*"([^"]+)""#).unwrap();

    if let Some(caps) = re.captures(&content) {
        Ok(caps.get(1).unwrap().as_str().to_string())
    } else {
        Err(format!("Could not find name in {}", cargo_toml_path))
    }
}

fn check_version_on_crates_io(crate_name: &str, version: &str) -> bool {
    let url = format!("https://crates.io/api/v1/crates/{}/{}", crate_name, version);

    match ureq::get(&url)
        .set("User-Agent", "rust-script-version-and-commit")
        .call()
    {
        Ok(response) => {
            if response.status() == 200 {
                if let Ok(body) = response.into_string() {
                    if let Ok(data) = serde_json::from_str::<CratesIoVersion>(&body) {
                        return data.version.is_some();
                    }
                }
            }
            false
        }
        Err(ureq::Error::Status(404, _)) => false,
        Err(e) => {
            eprintln!("Warning: Could not check crates.io: {}", e);
            false
        }
    }
}

fn strip_frontmatter(content: &str) -> String {
    let re = Regex::new(r"(?s)^---\s*\n.*?\n---\s*\n(.*)$").unwrap();
    if let Some(caps) = re.captures(content) {
        caps.get(1).unwrap().as_str().trim().to_string()
    } else {
        content.trim().to_string()
    }
}

fn collect_changelog(changelog_dir: &str, changelog_file: &str, version: &str) {
    let dir_path = Path::new(changelog_dir);
    if !dir_path.exists() {
        return;
    }

    let mut files: Vec<_> = match fs::read_dir(dir_path) {
        Ok(entries) => entries
            .filter_map(|e| e.ok())
            .map(|e| e.path())
            .filter(|p| {
                p.extension().map_or(false, |ext| ext == "md")
                    && p.file_name().map_or(false, |name| name != "README.md")
            })
            .collect(),
        Err(_) => return,
    };

    if files.is_empty() {
        return;
    }

    files.sort();

    let fragments: Vec<String> = files
        .iter()
        .filter_map(|f| fs::read_to_string(f).ok())
        .map(|c| strip_frontmatter(&c))
        .filter(|c| !c.is_empty())
        .collect();

    if fragments.is_empty() {
        return;
    }

    let date_str = Utc::now().format("%Y-%m-%d").to_string();
    let new_entry = format!("\n## [{}] - {}\n\n{}\n", version, date_str, fragments.join("\n\n"));

    if Path::new(changelog_file).exists() {
        let mut content = fs::read_to_string(changelog_file).unwrap_or_default();
        let lines: Vec<&str> = content.lines().collect();
        let mut insert_index = None;

        for (i, line) in lines.iter().enumerate() {
            if line.starts_with("## [") {
                insert_index = Some(i);
                break;
            }
        }

        if let Some(idx) = insert_index {
            let mut new_lines: Vec<String> = lines[..idx].iter().map(|s| s.to_string()).collect();
            new_lines.push(new_entry.clone());
            new_lines.extend(lines[idx..].iter().map(|s| s.to_string()));
            content = new_lines.join("\n");
        } else {
            content.push_str(&new_entry);
        }

        fs::write(changelog_file, content).expect("Failed to write changelog");
    }

    println!("Collected {} changelog fragment(s)", files.len());
}

fn main() {
    let bump_type = match get_arg("bump-type") {
        Some(bt) => bt,
        None => {
            eprintln!("Usage: rust-script scripts/version-and-commit.rs --bump-type <major|minor|patch> [--description <desc>] [--rust-root <path>]");
            exit(1);
        }
    };

    if !["major", "minor", "patch"].contains(&bump_type.as_str()) {
        eprintln!("Invalid bump type: {}. Must be major, minor, or patch.", bump_type);
        exit(1);
    }

    let description = get_arg("description");
    let rust_root = get_rust_root();
    let cargo_toml = get_cargo_toml_path(&rust_root);
    let changelog_dir = get_changelog_dir(&rust_root);
    let changelog_file = get_changelog_path(&rust_root);

    // Configure git
    let _ = exec("git", &["config", "user.name", "github-actions[bot]"]);
    let _ = exec("git", &["config", "user.email", "github-actions[bot]@users.noreply.github.com"]);

    // Get current version
    let content = match fs::read_to_string(&cargo_toml) {
        Ok(c) => c,
        Err(e) => {
            eprintln!("Error reading {}: {}", cargo_toml, e);
            exit(1);
        }
    };

    let current = match Version::parse(&content) {
        Some(v) => v,
        None => {
            eprintln!("Error: Could not parse version from {}", cargo_toml);
            exit(1);
        }
    };

    let new_version = current.bump(&bump_type);

    // Check if this version was already published to crates.io (the source of truth)
    let crate_name = match get_crate_name(&cargo_toml) {
        Ok(name) => name,
        Err(e) => {
            eprintln!("Error: {}", e);
            exit(1);
        }
    };

    if check_version_on_crates_io(&crate_name, &new_version) {
        println!("Version {} already published on crates.io", new_version);
        set_output("already_released", "true");
        set_output("new_version", &new_version);
        return;
    }

    // Update version in Cargo.toml
    if let Err(e) = update_cargo_toml(&cargo_toml, &new_version) {
        eprintln!("Error: {}", e);
        exit(1);
    }

    // Collect changelog fragments
    collect_changelog(&changelog_dir, &changelog_file, &new_version);

    // Stage Cargo.toml and CHANGELOG.md
    let _ = exec("git", &["add", &cargo_toml, &changelog_file]);

    // Check if there are changes to commit
    if exec_check("git", &["diff", "--cached", "--quiet"]) {
        // No changes to commit
        println!("No changes to commit");
        set_output("version_committed", "false");
        set_output("new_version", &new_version);
        return;
    }

    // Commit changes
    let commit_msg = match &description {
        Some(desc) => format!("chore: release v{}\n\n{}", new_version, desc),
        None => format!("chore: release v{}", new_version),
    };

    if let Err(e) = exec("git", &["commit", "-m", &commit_msg]) {
        eprintln!("Error committing: {}", e);
        exit(1);
    }
    println!("Committed version {}", new_version);

    // Create tag
    let tag_msg = match &description {
        Some(desc) => format!("Release v{}\n\n{}", new_version, desc),
        None => format!("Release v{}", new_version),
    };

    if let Err(e) = exec("git", &["tag", "-a", &format!("v{}", new_version), "-m", &tag_msg]) {
        eprintln!("Error creating tag: {}", e);
        exit(1);
    }
    println!("Created tag v{}", new_version);

    // Push changes and tag
    if let Err(e) = exec("git", &["push"]) {
        eprintln!("Error pushing: {}", e);
        exit(1);
    }

    if let Err(e) = exec("git", &["push", "--tags"]) {
        eprintln!("Error pushing tags: {}", e);
        exit(1);
    }
    println!("Pushed changes and tags");

    set_output("version_committed", "true");
    set_output("new_version", &new_version);
}
