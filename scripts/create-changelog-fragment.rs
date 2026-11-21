#!/usr/bin/env rust-script
//! Create a changelog fragment for manual release PR
//!
//! This script creates a changelog fragment with the appropriate
//! category based on the bump type.
//!
//! Usage: rust-script scripts/create-changelog-fragment.rs --bump-type <type> [--description <desc>]
//!
//! ```cargo
//! [dependencies]
//! chrono = "0.4.45"
//! getrandom = "0.4.3"
//! ```

use chrono::Utc;
use std::env;
use std::fs::{self, OpenOptions};
use std::io::{self, Write};
use std::path::Path;
use std::process::exit;

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
        return root;
    }

    if let Ok(root) = env::var("RUST_ROOT") {
        if !root.is_empty() {
            return root;
        }
    }

    if Path::new("./Cargo.toml").exists() {
        return ".".to_string();
    }

    if Path::new("./rust/Cargo.toml").exists() {
        return "rust".to_string();
    }

    ".".to_string()
}

fn get_changelog_dir(rust_root: &str) -> String {
    if rust_root == "." {
        "changelog.d".to_string()
    } else {
        format!("{}/changelog.d", rust_root)
    }
}

fn get_category(bump_type: &str) -> &'static str {
    match bump_type {
        "major" => "### Breaking Changes",
        "minor" => "### Added",
        "patch" => "### Fixed",
        _ => "### Changed",
    }
}

fn generate_timestamp() -> String {
    Utc::now().format("%Y%m%d%H%M%S").to_string()
}

fn generate_stop_commands_token() -> Result<String, String> {
    getrandom::u64()
        .and_then(|high| getrandom::u64().map(|low| format!("{high:016x}{low:016x}")))
        .map_err(|error| format!("could not generate a stop-commands token: {error}"))
}

/// Print operator-controlled text without allowing legacy `##[...]` or modern
/// `::...::` command syntax inside it to be interpreted by the Actions runner.
fn print_fragment_content(fragment_content: &str) -> Result<(), String> {
    if env::var_os("GITHUB_ACTIONS").is_some() {
        let token = generate_stop_commands_token()?;
        println!("::stop-commands::{token}");
        print!("{fragment_content}");
        if !fragment_content.ends_with('\n') {
            println!();
        }
        println!("::{token}::");
    } else {
        print!("{fragment_content}");
    }
    Ok(())
}

fn write_fragment(path: &Path, content: &[u8]) -> io::Result<()> {
    OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(path)?
        .write_all(content)
}

fn main() {
    let bump_type = get_arg("bump-type").unwrap_or_else(|| "patch".to_string());
    let description = get_arg("description");

    // Validate bump type
    if !["major", "minor", "patch"].contains(&bump_type.as_str()) {
        eprintln!(
            "Invalid bump type: {}. Must be major, minor, or patch.",
            bump_type
        );
        exit(1);
    }

    let rust_root = get_rust_root();
    let changelog_dir = get_changelog_dir(&rust_root);
    let timestamp = generate_timestamp();
    let fragment_file = format!("{}/{}-manual-{}.md", changelog_dir, timestamp, bump_type);

    // Determine changelog category based on bump type
    let category = get_category(&bump_type);

    // Create changelog fragment with frontmatter
    let description_text = description.unwrap_or_else(|| format!("Manual {} release", bump_type));
    let fragment_content = format!(
        "---\nbump: {}\n---\n\n{}\n\n- {}\n",
        bump_type, category, description_text
    );

    // Ensure changelog directory exists
    let dir_path = Path::new(&changelog_dir);
    if !dir_path.exists() {
        if let Err(e) = fs::create_dir_all(dir_path) {
            eprintln!("Error creating directory {}: {}", changelog_dir, e);
            exit(1);
        }
    }

    if let Err(e) = write_fragment(Path::new(&fragment_file), fragment_content.as_bytes()) {
        eprintln!("Error writing fragment file {fragment_file}: {e}");
        exit(1);
    }

    println!("Created changelog fragment: {}", fragment_file);
    println!();
    println!("Content:");
    if let Err(error) = print_fragment_content(&fragment_content) {
        eprintln!("Error printing fragment safely: {error}");
        exit(1);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;
    use std::sync::Barrier;
    use std::thread;

    struct TestDirectory(PathBuf);

    impl TestDirectory {
        fn new() -> Self {
            let suffix = getrandom::u64().unwrap();
            let path = env::temp_dir().join(format!("manual-changelog-fragment-{suffix:016x}"));
            fs::create_dir(&path).unwrap();
            Self(path)
        }

        fn fragment_path(&self) -> PathBuf {
            self.0.join("20261121000000-manual-patch.md")
        }
    }

    impl Drop for TestDirectory {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }

    #[test]
    fn existing_fragment_is_preserved_on_collision() {
        let directory = TestDirectory::new();
        let path = directory.fragment_path();
        let original = "---\r\nbump: patch\r\n---\r\n\r\n### Fixed\r\n- Original λ\r\n";
        fs::write(&path, original).unwrap();

        let result = write_fragment(&path, b"replacement");

        assert_eq!(fs::read(&path).unwrap(), original.as_bytes());
        assert_eq!(result.unwrap_err().kind(), io::ErrorKind::AlreadyExists);
    }

    #[test]
    fn concurrent_creators_leave_one_complete_fragment() {
        let directory = TestDirectory::new();
        let path = directory.fragment_path();
        let start = Barrier::new(2);
        let contents = [
            "---\nbump: patch\n---\n\n### Fixed\n- First fragment\n",
            "---\nbump: patch\n---\n\n### Fixed\n- Second fragment\n",
        ];

        let [first, second] = thread::scope(|scope| {
            contents
                .map(|content| {
                    let path = &path;
                    let start = &start;
                    scope.spawn(move || {
                        start.wait();
                        write_fragment(path, content.as_bytes())
                    })
                })
                .map(|writer| writer.join().unwrap())
        });

        let (winner, collision) = match (first, second) {
            (Ok(()), Err(error)) => (contents[0], error),
            (Err(error), Ok(())) => (contents[1], error),
            results => panic!("expected one successful writer, got {results:?}"),
        };
        assert_eq!(collision.kind(), io::ErrorKind::AlreadyExists);
        assert_eq!(fs::read(&path).unwrap(), winner.as_bytes());
    }

    #[test]
    fn missing_parent_is_reported_without_creating_a_fragment() {
        let directory = TestDirectory::new();
        let path = directory.0.join("missing/20261121000000-manual-patch.md");

        let error = write_fragment(&path, b"fragment").unwrap_err();

        assert_eq!(error.kind(), io::ErrorKind::NotFound);
        assert!(!path.exists());
    }

    #[cfg(unix)]
    #[test]
    fn existing_symlink_and_its_target_are_preserved() {
        let directory = TestDirectory::new();
        let path = directory.fragment_path();
        let target = directory.0.join("original.md");
        fs::write(&target, b"original").unwrap();
        std::os::unix::fs::symlink(&target, &path).unwrap();

        let result = write_fragment(&path, b"replacement");

        assert_eq!(fs::read(&target).unwrap(), b"original");
        assert_eq!(fs::read_link(&path).unwrap(), target);
        assert_eq!(result.unwrap_err().kind(), io::ErrorKind::AlreadyExists);
    }

    #[test]
    fn stop_commands_tokens_are_random_128_bit_hex_values() {
        let first = generate_stop_commands_token().unwrap();
        let second = generate_stop_commands_token().unwrap();
        assert_eq!(first.len(), 32);
        assert!(first.bytes().all(|byte| byte.is_ascii_hexdigit()));
        assert_ne!(first, second);
    }
}
