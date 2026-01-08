#!/usr/bin/env node

/**
 * Check for manual version modification in Cargo.toml
 *
 * This script prevents manual version changes in pull requests.
 * Versions should be managed automatically by the CI/CD pipeline
 * using changelog fragments in changelog.d/.
 *
 * Key behavior:
 * - Detects if `version = "..."` line has changed in Cargo.toml
 * - Fails the CI check if manual version change is detected
 * - Skips check for automated release branches (changelog-manual-release-*)
 *
 * Usage:
 *   node scripts/check-version-modification.mjs
 *
 * Environment variables (set by GitHub Actions):
 *   - GITHUB_HEAD_REF: The head branch name for PRs
 *   - GITHUB_BASE_REF: The base branch name for PRs
 *   - GITHUB_EVENT_NAME: Should be 'pull_request'
 *
 * Exit codes:
 *   - 0: No manual version changes detected (or check skipped)
 *   - 1: Manual version changes detected
 */

import { execSync } from 'child_process';

/**
 * Execute a shell command and return trimmed output
 * @param {string} command - The command to execute
 * @returns {string} - The trimmed command output
 */
function exec(command) {
  try {
    return execSync(command, { encoding: 'utf-8' }).trim();
  } catch (error) {
    // Return empty string for commands that fail (like git diff with no changes)
    return '';
  }
}

/**
 * Check if the current branch should skip version checking
 * @returns {boolean} True if version check should be skipped
 */
function shouldSkipVersionCheck() {
  const headRef = process.env.GITHUB_HEAD_REF || '';

  // Skip for automated release PRs
  const automatedBranchPrefixes = [
    'changelog-manual-release-',
    'changeset-release/',
    'release/',
    'automated-release/',
  ];

  for (const prefix of automatedBranchPrefixes) {
    if (headRef.startsWith(prefix)) {
      console.log(`Skipping version check for automated branch: ${headRef}`);
      return true;
    }
  }

  return false;
}

/**
 * Get the diff for Cargo.toml between base and head
 * @returns {string} The diff output
 */
function getCargoTomlDiff() {
  const baseRef = process.env.GITHUB_BASE_REF || 'main';

  // Ensure we have the base branch
  try {
    execSync(`git fetch origin ${baseRef} --depth=1`, { stdio: 'ignore' });
  } catch {
    // Ignore fetch errors - base might already be available
  }

  // Get the diff for Cargo.toml
  const diff = exec(`git diff origin/${baseRef}...HEAD -- Cargo.toml`);
  return diff;
}

/**
 * Check if the diff contains version line changes
 * @param {string} diff - The git diff output
 * @returns {boolean} True if version was modified
 */
function hasVersionChange(diff) {
  if (!diff) {
    return false;
  }

  // Look for changes to the version line
  // Match lines that start with + or - followed by version = "..."
  const versionChangePattern = /^[+-]version\s*=\s*"/m;
  return versionChangePattern.test(diff);
}

/**
 * Main function
 */
function main() {
  console.log('Checking for manual version modifications in Cargo.toml...\n');

  // Only run on pull requests
  const eventName = process.env.GITHUB_EVENT_NAME || '';
  if (eventName !== 'pull_request') {
    console.log(`Skipping: Not a pull request event (event: ${eventName})`);
    process.exit(0);
  }

  // Skip for automated release branches
  if (shouldSkipVersionCheck()) {
    process.exit(0);
  }

  // Get and check the diff
  const diff = getCargoTomlDiff();

  if (!diff) {
    console.log('No changes to Cargo.toml detected.');
    console.log('Version check passed.');
    process.exit(0);
  }

  // Check for version changes
  if (hasVersionChange(diff)) {
    console.error('Error: Manual version change detected in Cargo.toml!\n');
    console.error('Versions are managed automatically by the CI/CD pipeline.');
    console.error('Please do not modify the version field directly.\n');
    console.error('To trigger a release, add a changelog fragment to changelog.d/');
    console.error('with the appropriate bump type (major, minor, or patch).\n');
    console.error('See changelog.d/README.md for more information.\n');
    console.error('If you need to undo your version change, run:');
    console.error('  git checkout origin/main -- Cargo.toml');
    process.exit(1);
  }

  console.log('Cargo.toml was modified but version field was not changed.');
  console.log('Version check passed.');
  process.exit(0);
}

// Run the check
main();
