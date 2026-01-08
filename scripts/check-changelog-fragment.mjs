#!/usr/bin/env node

/**
 * Check if a changelog fragment was added in the current PR
 *
 * This script validates that a changelog fragment is added in the PR diff,
 * not just checking if any fragments exist in the directory. This prevents
 * the check from incorrectly passing when there are leftover fragments
 * from previous PRs that haven't been released yet.
 *
 * Usage: node scripts/check-changelog-fragment.mjs
 *
 * Environment variables (set by GitHub Actions):
 *   - GITHUB_BASE_REF: Base branch name for PR (e.g., "main")
 *
 * Exit codes:
 *   - 0: Check passed (fragment added or no source changes)
 *   - 1: Check failed (source changes without changelog fragment)
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
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    return '';
  }
}

/**
 * Get the list of changed files in the PR
 * @returns {string[]} Array of changed file paths
 */
function getChangedFiles() {
  const baseRef = process.env.GITHUB_BASE_REF || 'main';
  console.log(`Comparing against origin/${baseRef}...HEAD`);

  try {
    const output = exec(`git diff --name-only origin/${baseRef}...HEAD`);
    return output ? output.split('\n').filter(Boolean) : [];
  } catch (error) {
    console.error(`Git diff failed: ${error.message}`);
    return [];
  }
}

/**
 * Check if a file is a source file that requires a changelog fragment
 * @param {string} filePath - The file path to check
 * @returns {boolean} True if the file is a source file
 */
function isSourceFile(filePath) {
  // Source files that require changelog fragments
  const sourcePatterns = [
    /^src\//,
    /^tests\//,
    /^scripts\//,
    /^Cargo\.toml$/,
  ];

  return sourcePatterns.some((pattern) => pattern.test(filePath));
}

/**
 * Check if a file is a changelog fragment
 * @param {string} filePath - The file path to check
 * @returns {boolean} True if the file is a changelog fragment
 */
function isChangelogFragment(filePath) {
  // Changelog fragments are .md files in changelog.d/ (excluding README.md)
  return (
    filePath.startsWith('changelog.d/') &&
    filePath.endsWith('.md') &&
    !filePath.endsWith('README.md')
  );
}

/**
 * Main function to check changelog fragments
 */
function checkChangelogFragment() {
  console.log('Checking for changelog fragment in PR diff...\n');

  const changedFiles = getChangedFiles();

  if (changedFiles.length === 0) {
    console.log('No changed files found');
    process.exit(0);
  }

  console.log('Changed files:');
  changedFiles.forEach((file) => console.log(`  ${file}`));
  console.log('');

  // Count source files changed
  const sourceChanges = changedFiles.filter(isSourceFile);
  const sourceChangedCount = sourceChanges.length;

  console.log(`Source files changed: ${sourceChangedCount}`);
  if (sourceChangedCount > 0) {
    sourceChanges.forEach((file) => console.log(`  ${file}`));
  }
  console.log('');

  // Count changelog fragments added in this PR
  const fragmentsAdded = changedFiles.filter(isChangelogFragment);
  const fragmentAddedCount = fragmentsAdded.length;

  console.log(`Changelog fragments added: ${fragmentAddedCount}`);
  if (fragmentAddedCount > 0) {
    fragmentsAdded.forEach((file) => console.log(`  ${file}`));
  }
  console.log('');

  // Check if source files changed but no fragment was added
  if (sourceChangedCount > 0 && fragmentAddedCount === 0) {
    console.error(
      '::error::No changelog fragment found in this PR. Please add a changelog entry in changelog.d/'
    );
    console.error('');
    console.error('To create a changelog fragment:');
    console.error(
      '  Create a new .md file in changelog.d/ with your changes'
    );
    console.error('');
    console.error('See changelog.d/README.md for more information.');
    process.exit(1);
  }

  console.log(
    `Changelog check passed (source files changed: ${sourceChangedCount}, fragments added: ${fragmentAddedCount})`
  );
}

// Run the check
checkChangelogFragment();
