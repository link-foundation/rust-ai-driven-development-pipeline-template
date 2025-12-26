#!/usr/bin/env python3
"""Bump version in Cargo.toml and commit changes.

This script is used by the CI/CD pipeline for releases.
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path


def get_current_version() -> tuple[int, int, int]:
    """Get current version from Cargo.toml.

    Returns:
        Tuple of (major, minor, patch)
    """
    cargo_toml = Path("Cargo.toml")
    content = cargo_toml.read_text()
    match = re.search(r'^version\s*=\s*"(\d+)\.(\d+)\.(\d+)"', content, re.MULTILINE)
    if not match:
        print("Error: Could not parse version from Cargo.toml", file=sys.stderr)
        sys.exit(1)
    return int(match.group(1)), int(match.group(2)), int(match.group(3))


def bump_version(current: tuple[int, int, int], bump_type: str) -> str:
    """Calculate new version based on bump type.

    Args:
        current: Current version as tuple
        bump_type: One of 'major', 'minor', 'patch'

    Returns:
        New version string
    """
    major, minor, patch = current
    if bump_type == "major":
        return f"{major + 1}.0.0"
    elif bump_type == "minor":
        return f"{major}.{minor + 1}.0"
    else:
        return f"{major}.{minor}.{patch + 1}"


def update_cargo_toml(new_version: str) -> None:
    """Update version in Cargo.toml.

    Args:
        new_version: New version string
    """
    cargo_toml = Path("Cargo.toml")
    content = cargo_toml.read_text()
    content = re.sub(
        r'^(version\s*=\s*")[^"]+(")',
        f'\\g<1>{new_version}\\2',
        content,
        count=1,
        flags=re.MULTILINE,
    )
    cargo_toml.write_text(content)
    print(f"Updated Cargo.toml to version {new_version}")


def check_tag_exists(version: str) -> bool:
    """Check if a git tag already exists for this version.

    Args:
        version: Version to check

    Returns:
        True if tag exists
    """
    result = subprocess.run(
        ["git", "rev-parse", f"v{version}"],
        capture_output=True,
        text=True,
    )
    return result.returncode == 0


def commit_and_tag(version: str, description: str | None = None) -> None:
    """Commit version changes and create tag.

    Args:
        version: Version for the tag
        description: Optional release description
    """
    # Stage Cargo.toml and CHANGELOG.md
    subprocess.run(["git", "add", "Cargo.toml", "CHANGELOG.md"], check=True)

    # Check if there are changes to commit
    result = subprocess.run(
        ["git", "diff", "--cached", "--quiet"],
        capture_output=True,
    )

    if result.returncode != 0:
        # There are changes to commit
        commit_msg = f"chore: release v{version}"
        if description:
            commit_msg += f"\n\n{description}"
        subprocess.run(["git", "commit", "-m", commit_msg], check=True)
        print(f"Committed version {version}")

    # Create tag
    tag_msg = f"Release v{version}"
    if description:
        tag_msg += f"\n\n{description}"
    subprocess.run(["git", "tag", "-a", f"v{version}", "-m", tag_msg], check=True)
    print(f"Created tag v{version}")

    # Push changes and tag
    subprocess.run(["git", "push"], check=True)
    subprocess.run(["git", "push", "--tags"], check=True)
    print("Pushed changes and tags")


def main() -> None:
    """Main function."""
    parser = argparse.ArgumentParser(description="Bump version and commit")
    parser.add_argument(
        "--bump-type",
        choices=["major", "minor", "patch"],
        required=True,
        help="Type of version bump",
    )
    parser.add_argument(
        "--description",
        default=None,
        help="Release description",
    )
    args = parser.parse_args()

    current = get_current_version()
    new_version = bump_version(current, args.bump_type)

    # Check if this version was already released
    if check_tag_exists(new_version):
        print(f"Tag v{new_version} already exists")
        print("::set-output name=already_released::true")
        print(f"::set-output name=new_version::{new_version}")
        return

    update_cargo_toml(new_version)
    commit_and_tag(new_version, args.description)

    # Set GitHub Actions outputs
    print(f"::set-output name=version_committed::true")
    print(f"::set-output name=new_version::{new_version}")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
