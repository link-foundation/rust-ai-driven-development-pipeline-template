#!/usr/bin/env python3
"""Collect changelog fragments into CHANGELOG.md.

This script collects all .md files from changelog.d/ (except README.md)
and prepends them to CHANGELOG.md, then removes the processed fragments.
"""

from __future__ import annotations

import re
import sys
from datetime import datetime
from pathlib import Path


def get_version_from_cargo() -> str:
    """Extract version from Cargo.toml.

    Returns:
        Version string
    """
    cargo_toml = Path("Cargo.toml")
    if not cargo_toml.exists():
        print("Error: Cargo.toml not found", file=sys.stderr)
        sys.exit(1)

    content = cargo_toml.read_text()
    match = re.search(r'^version\s*=\s*"([^"]+)"', content, re.MULTILINE)
    if not match:
        print("Error: Could not find version in Cargo.toml", file=sys.stderr)
        sys.exit(1)

    return match.group(1)


def collect_fragments() -> str:
    """Collect all changelog fragments.

    Returns:
        Combined changelog content
    """
    changelog_dir = Path("changelog.d")
    if not changelog_dir.exists():
        return ""

    fragments = []
    for fragment_path in sorted(changelog_dir.glob("*.md")):
        if fragment_path.name == "README.md":
            continue
        content = fragment_path.read_text().strip()
        if content:
            fragments.append(content)

    return "\n\n".join(fragments)


def update_changelog(version: str, fragments: str) -> None:
    """Update CHANGELOG.md with collected fragments.

    Args:
        version: Version number for the release
        fragments: Collected fragment content
    """
    changelog_path = Path("CHANGELOG.md")
    insert_marker = "<!-- changelog-insert-here -->"
    date_str = datetime.now().strftime("%Y-%m-%d")

    new_entry = f"\n## [{version}] - {date_str}\n\n{fragments}\n"

    if changelog_path.exists():
        content = changelog_path.read_text()
        if insert_marker in content:
            content = content.replace(insert_marker, f"{insert_marker}{new_entry}")
        else:
            # Insert after the header
            lines = content.split("\n")
            for i, line in enumerate(lines):
                if line.startswith("## ["):
                    lines.insert(i, new_entry)
                    break
            content = "\n".join(lines)
    else:
        content = f"""# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

{insert_marker}
{new_entry}
"""

    changelog_path.write_text(content)
    print(f"Updated CHANGELOG.md with version {version}")


def remove_fragments() -> None:
    """Remove processed changelog fragments."""
    changelog_dir = Path("changelog.d")
    if not changelog_dir.exists():
        return

    for fragment_path in changelog_dir.glob("*.md"):
        if fragment_path.name == "README.md":
            continue
        fragment_path.unlink()
        print(f"Removed {fragment_path}")


def main() -> None:
    """Main function."""
    version = get_version_from_cargo()
    print(f"Collecting changelog fragments for version {version}")

    fragments = collect_fragments()
    if not fragments:
        print("No changelog fragments found")
        return

    update_changelog(version, fragments)
    remove_fragments()

    print("Changelog collection complete")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
