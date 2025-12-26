#!/usr/bin/env python3
"""Create a GitHub release with changelog content.

This script creates a GitHub release using the gh CLI.
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path


def get_changelog_for_version(version: str) -> str:
    """Extract changelog content for a specific version.

    Args:
        version: Version to extract changelog for

    Returns:
        Changelog content for the version
    """
    changelog_path = Path("CHANGELOG.md")
    if not changelog_path.exists():
        return f"Release v{version}"

    content = changelog_path.read_text()

    # Find the section for this version
    pattern = rf"## \[{re.escape(version)}\].*?\n(.*?)(?=\n## \[|\Z)"
    match = re.search(pattern, content, re.DOTALL)

    if match:
        return match.group(1).strip()

    return f"Release v{version}"


def create_release(version: str, repository: str, body: str) -> None:
    """Create GitHub release using gh CLI.

    Args:
        version: Version for the release
        repository: Repository in owner/repo format
        body: Release body content
    """
    tag = f"v{version}"
    title = f"v{version}"

    cmd = [
        "gh",
        "release",
        "create",
        tag,
        "--repo",
        repository,
        "--title",
        title,
        "--notes",
        body,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        if "already exists" in result.stderr:
            print(f"Release {tag} already exists, skipping")
            return
        print(f"Error creating release: {result.stderr}", file=sys.stderr)
        sys.exit(1)

    print(f"Created release {tag}")
    print(result.stdout)


def main() -> None:
    """Main function."""
    parser = argparse.ArgumentParser(description="Create GitHub release")
    parser.add_argument(
        "--version",
        required=True,
        help="Version for the release",
    )
    parser.add_argument(
        "--repository",
        required=True,
        help="Repository in owner/repo format",
    )
    args = parser.parse_args()

    body = get_changelog_for_version(args.version)
    create_release(args.version, args.repository, body)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
