# Changelog Fragments

This directory contains changelog fragments that will be collected into `CHANGELOG.md` during releases.

## How to Add a Changelog Fragment

When making changes that should be documented in the changelog, create a fragment file:

```bash
# Create a new fragment with timestamp
touch changelog.d/$(date +%Y%m%d_%H%M%S)_description.md

# Or manually create a file matching the pattern: YYYYMMDD_HHMMSS_description.md
```

## Fragment Format

Each fragment should contain relevant sections. Use the appropriate sections:

```markdown
### Added
- Description of new feature

### Changed
- Description of change to existing functionality

### Fixed
- Description of bug fix

### Removed
- Description of removed feature

### Deprecated
- Description of deprecated feature

### Security
- Description of security fix
```

## Why Fragments?

Using changelog fragments (similar to [Changesets](https://github.com/changesets/changesets) in JavaScript and [Scriv](https://scriv.readthedocs.io/) in Python):

1. **No merge conflicts**: Multiple PRs can add fragments without conflicts
2. **Per-PR documentation**: Each PR documents its own changes
3. **Automated collection**: Fragments are automatically collected during release
4. **Consistent format**: Template ensures consistent changelog entries

## During Release

Fragments are automatically collected into `CHANGELOG.md` by running the collection script. This is handled automatically by the release workflow.
