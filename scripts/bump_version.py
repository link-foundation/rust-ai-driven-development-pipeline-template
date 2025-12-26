#!/usr/bin/env python3
"""Bump version in Cargo.toml.

A simple utility script for bumping the version number.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


def get_current_version() -> tuple[int, int, int]:
    """Get current version from Cargo.toml.

    Returns:
        Tuple of (major, minor, patch)
    """
    cargo_toml = Path("Cargo.toml")
    if not cargo_toml.exists():
        print("Error: Cargo.toml not found", file=sys.stderr)
        sys.exit(1)

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


def main() -> None:
    """Main function."""
    parser = argparse.ArgumentParser(description="Bump version in Cargo.toml")
    parser.add_argument(
        "bump_type",
        choices=["major", "minor", "patch"],
        help="Type of version bump",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be done without making changes",
    )
    args = parser.parse_args()

    current = get_current_version()
    current_str = f"{current[0]}.{current[1]}.{current[2]}"
    new_version = bump_version(current, args.bump_type)

    print(f"Current version: {current_str}")
    print(f"New version: {new_version}")

    if args.dry_run:
        print("Dry run - no changes made")
    else:
        update_cargo_toml(new_version)
        print("Updated Cargo.toml")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
