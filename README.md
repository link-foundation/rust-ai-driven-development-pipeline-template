# rust-ai-driven-development-pipeline-template

A comprehensive template for AI-driven Rust development with full CI/CD pipeline support.

[![CI/CD Pipeline](https://github.com/link-foundation/rust-ai-driven-development-pipeline-template/workflows/CI%2FCD%20Pipeline/badge.svg)](https://github.com/link-foundation/rust-ai-driven-development-pipeline-template/actions)
[![Rust Version](https://img.shields.io/badge/rust-1.70%2B-blue.svg)](https://www.rust-lang.org/)
[![License: Unlicense](https://img.shields.io/badge/license-Unlicense-blue.svg)](http://unlicense.org/)

## Features

- **Rust stable support**: Works with Rust stable version
- **Cross-platform testing**: CI runs on Ubuntu, macOS, and Windows
- **Comprehensive testing**: Unit tests, integration tests, and doc tests
- **Code quality**: rustfmt + Clippy with pedantic lints
- **Pre-commit hooks**: Automated code quality checks before commits
- **CI/CD pipeline**: GitHub Actions with multi-platform support
- **Changelog management**: Fragment-based changelog (like Changesets/Scriv)
- **Release automation**: Automatic GitHub releases

## Quick Start

### Using This Template

1. Click "Use this template" on GitHub to create a new repository
2. Clone your new repository
3. Update `Cargo.toml` with your package name and description
4. Rename the library and binary in `Cargo.toml`
5. Update imports in tests and examples
6. Build and start developing!

### Development Setup

```bash
# Clone the repository
git clone https://github.com/link-foundation/rust-ai-driven-development-pipeline-template.git
cd rust-ai-driven-development-pipeline-template

# Build the project
cargo build

# Run tests
cargo test

# Run the example binary
cargo run

# Run an example
cargo run --example basic_usage
```

### Running Tests

```bash
# Run all tests
cargo test

# Run tests with verbose output
cargo test --verbose

# Run doc tests
cargo test --doc

# Run a specific test
cargo test test_add_positive_numbers

# Run tests with output
cargo test -- --nocapture
```

### Code Quality Checks

```bash
# Format code
cargo fmt

# Check formatting (CI style)
cargo fmt --check

# Run Clippy lints
cargo clippy --all-targets --all-features

# Check file size limits
python3 scripts/check_file_size.py

# Run all checks
cargo fmt --check && cargo clippy --all-targets --all-features && python3 scripts/check_file_size.py
```

## Project Structure

```
.
├── .github/
│   └── workflows/
│       └── release.yml         # CI/CD pipeline configuration
├── changelog.d/                # Changelog fragments
│   ├── README.md               # Fragment instructions
│   └── *.md                    # Individual changelog entries
├── examples/
│   └── basic_usage.rs          # Usage examples
├── scripts/
│   ├── bump_version.py         # Version bumping utility
│   ├── check_file_size.py      # File size validation script
│   ├── collect_changelog.py    # Changelog collection script
│   ├── create_github_release.py # GitHub release creation
│   └── version_and_commit.py   # CI/CD version management
├── src/
│   ├── lib.rs                  # Library entry point
│   └── main.rs                 # Binary entry point
├── tests/
│   └── integration_test.rs     # Integration tests
├── .gitignore                  # Git ignore patterns
├── .pre-commit-config.yaml     # Pre-commit hooks configuration
├── Cargo.toml                  # Project configuration
├── CHANGELOG.md                # Project changelog
├── CONTRIBUTING.md             # Contribution guidelines
├── LICENSE                     # Unlicense (public domain)
└── README.md                   # This file
```

## Design Choices

### Code Quality Tools

- **rustfmt**: Standard Rust code formatter
  - Ensures consistent code style across the project
  - Configured to run on all Rust files

- **Clippy**: Rust linter with comprehensive checks
  - Pedantic and nursery lints enabled for strict code quality
  - Catches common mistakes and suggests improvements
  - Enforces best practices

- **Pre-commit hooks**: Automated checks before each commit
  - Runs rustfmt to ensure formatting
  - Runs Clippy to catch issues early
  - Runs tests to prevent broken commits

### Testing Strategy

The template supports multiple levels of testing:

- **Unit tests**: In `src/lib.rs` using `#[cfg(test)]` modules
- **Integration tests**: In `tests/` directory
- **Doc tests**: In documentation examples using `///` comments
- **Examples**: In `examples/` directory (also serve as documentation)

### Changelog Management

This template uses a fragment-based changelog system similar to:
- [Changesets](https://github.com/changesets/changesets) (JavaScript)
- [Scriv](https://scriv.readthedocs.io/) (Python)

Benefits:
- **No merge conflicts**: Multiple PRs can add fragments without conflicts
- **Per-PR documentation**: Each PR documents its own changes
- **Automated collection**: Fragments are collected during release
- **Consistent format**: Template ensures consistent changelog entries

```bash
# Create a changelog fragment
touch changelog.d/$(date +%Y%m%d_%H%M%S)_my_change.md

# Edit the fragment to document your changes
```

### CI/CD Pipeline

The GitHub Actions workflow provides:

1. **Linting**: rustfmt and Clippy checks
2. **Changelog check**: Warns if PRs are missing changelog fragments
3. **Test matrix**: 3 OS (Ubuntu, macOS, Windows) with Rust stable
4. **Building**: Release build and package validation
5. **Release**: Automated GitHub releases when version changes

### Release Automation

The release workflow supports:

- **Auto-release**: Automatically creates releases when version in Cargo.toml changes
- **Manual release**: Trigger releases via workflow_dispatch with version bump type
- **Changelog collection**: Automatically collects fragments during release
- **GitHub releases**: Automatic creation with CHANGELOG content

## Configuration

### Updating Package Name

After creating a repository from this template:

1. Update `Cargo.toml`:
   - Change `name` field
   - Update `repository` and `documentation` URLs
   - Change `[lib]` and `[[bin]]` names

2. Rename the crate in imports:
   - `tests/integration_test.rs`
   - `examples/basic_usage.rs`
   - `src/main.rs`

### Clippy Configuration

Clippy is configured in `Cargo.toml` under `[lints.clippy]`:

- Pedantic lints enabled for strict code quality
- Nursery lints enabled for additional checks
- Some common patterns allowed (e.g., `module_name_repetitions`)

### rustfmt Configuration

Uses default rustfmt settings. To customize, create a `rustfmt.toml`:

```toml
edition = "2021"
max_width = 100
tab_spaces = 4
```

## Scripts Reference

| Script                              | Description                    |
| ----------------------------------- | ------------------------------ |
| `cargo test`                        | Run all tests                  |
| `cargo fmt`                         | Format code                    |
| `cargo clippy`                      | Run lints                      |
| `cargo run --example basic_usage`   | Run example                    |
| `python3 scripts/check_file_size.py`| Check file size limits         |
| `python3 scripts/bump_version.py`   | Bump version                   |

## Example Usage

```rust
use my_package::{add, multiply, delay};

fn main() {
    // Basic arithmetic
    let sum = add(2, 3);     // 5
    let product = multiply(2, 3);  // 6

    println!("2 + 3 = {sum}");
    println!("2 * 3 = {product}");
}

// Async operations
#[tokio::main]
async fn main() {
    delay(1.0).await;  // Wait for 1 second
}
```

See `examples/basic_usage.rs` for more examples.

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and add tests
4. Run quality checks: `cargo fmt && cargo clippy && cargo test`
5. Add a changelog fragment
6. Commit your changes (pre-commit hooks will run automatically)
7. Push and create a Pull Request

## License

[Unlicense](LICENSE) - Public Domain

This is free and unencumbered software released into the public domain. See [LICENSE](LICENSE) for details.

## Acknowledgments

Inspired by:
- [js-ai-driven-development-pipeline-template](https://github.com/link-foundation/js-ai-driven-development-pipeline-template)
- [python-ai-driven-development-pipeline-template](https://github.com/link-foundation/python-ai-driven-development-pipeline-template)

## Resources

- [Rust Book](https://doc.rust-lang.org/book/)
- [Cargo Book](https://doc.rust-lang.org/cargo/)
- [Clippy Documentation](https://rust-lang.github.io/rust-clippy/)
- [rustfmt Documentation](https://rust-lang.github.io/rustfmt/)
- [Pre-commit Documentation](https://pre-commit.com/)
