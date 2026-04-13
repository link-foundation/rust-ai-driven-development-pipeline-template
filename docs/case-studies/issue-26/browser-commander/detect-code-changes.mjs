#!/usr/bin/env node

/**
 * Detect code changes for CI/CD pipeline
 *
 * This script detects what types of files have changed between two commits
 * and outputs the results for use in GitHub Actions workflow conditions.
 *
 * Key behavior:
 * - For PRs: compares PR head against base branch
 * - For pushes: compares HEAD against HEAD^
 * - Excludes certain folders and file types from "code changes" detection
 *
 * Excluded from code changes (don't require changelog/changeset):
 * - Markdown files (*.md) in any folder
 * - .changeset/ folder (changeset metadata)
 * - changelog.d/ folder (changelog fragments)
 * - docs/ folder (documentation)
 * - experiments/ folder (experimental scripts)
 * - examples/ folder (example scripts)
 *
 * Usage:
 *   node scripts/detect-code-changes.mjs
 *
 * Environment variables (set by GitHub Actions):
 *   - GITHUB_EVENT_NAME: 'pull_request' or 'push'
 *   - GITHUB_BASE_SHA: Base commit SHA for PR
 *   - GITHUB_HEAD_SHA: Head commit SHA for PR
 *
 * Outputs (written to GITHUB_OUTPUT):
 *   - rs-changed: 'true' if any .rs files changed
 *   - toml-changed: 'true' if any .toml files changed
 *   - mjs-changed: 'true' if any .mjs files changed
 *   - js-changed: 'true' if any .js files changed
 *   - package-changed: 'true' if package.json changed
 *   - docs-changed: 'true' if any .md files changed
 *   - workflow-changed: 'true' if any .github/workflows/ files changed
 *   - any-code-changed: 'true' if any code files changed
 *   - js-code-changed: 'true' if any JS code files changed
 *   - rust-code-changed: 'true' if any Rust code files changed
 */

import { execSync } from 'child_process';
import { appendFileSync } from 'fs';

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
 * Write output to GitHub Actions output file
 * @param {string} name - Output name
 * @param {string} value - Output value
 */
function setOutput(name, value) {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    appendFileSync(outputFile, `${name}=${value}\n`);
  }
  console.log(`${name}=${value}`);
}

/**
 * Get the list of changed files between two commits
 * @returns {string[]} Array of changed file paths
 */
function getChangedFiles() {
  const eventName = process.env.GITHUB_EVENT_NAME || 'local';

  if (eventName === 'pull_request') {
    const baseSha = process.env.GITHUB_BASE_SHA;
    const headSha = process.env.GITHUB_HEAD_SHA;

    if (baseSha && headSha) {
      console.log(`Comparing PR: ${baseSha}...${headSha}`);
      try {
        // Ensure we have the base commit
        try {
          execSync(`git cat-file -e ${baseSha}`, { stdio: 'ignore' });
        } catch {
          console.log('Base commit not available locally, attempting fetch...');
          execSync(`git fetch origin ${baseSha}`, { stdio: 'inherit' });
        }
        const output = exec(`git diff --name-only ${baseSha} ${headSha}`);
        return output ? output.split('\n').filter(Boolean) : [];
      } catch (error) {
        console.error(`Git diff failed: ${error.message}`);
      }
    }
  }

  // For push events or fallback
  console.log('Comparing HEAD^ to HEAD');
  try {
    const output = exec('git diff --name-only HEAD^ HEAD');
    return output ? output.split('\n').filter(Boolean) : [];
  } catch {
    // If HEAD^ doesn't exist (first commit), list all files in HEAD
    console.log('HEAD^ not available, listing all files in HEAD');
    const output = exec('git ls-tree --name-only -r HEAD');
    return output ? output.split('\n').filter(Boolean) : [];
  }
}

/**
 * Check if a file should be excluded from code changes detection
 * @param {string} filePath - The file path to check
 * @returns {boolean} True if the file should be excluded
 */
function isExcludedFromCodeChanges(filePath) {
  // Exclude markdown files in any folder
  if (filePath.endsWith('.md')) {
    return true;
  }

  // Exclude specific folders from code changes
  const excludedFolders = [
    '.changeset/',
    'js/.changeset/',
    'changelog.d/',
    'rust/changelog.d/',
    'docs/',
    'experiments/',
    'examples/',
    'js/examples/',
  ];

  for (const folder of excludedFolders) {
    if (filePath.startsWith(folder)) {
      return true;
    }
  }

  return false;
}

/**
 * Main function to detect changes
 */
function detectChanges() {
  console.log('Detecting file changes for CI/CD...\n');

  const changedFiles = getChangedFiles();

  console.log('Changed files:');
  if (changedFiles.length === 0) {
    console.log('  (none)');
  } else {
    changedFiles.forEach((file) => console.log(`  ${file}`));
  }
  console.log('');

  // Detect .rs file changes (Rust source)
  const rsChanged = changedFiles.some((file) => file.endsWith('.rs'));
  setOutput('rs-changed', rsChanged ? 'true' : 'false');

  // Detect .toml file changes (Cargo.toml, Cargo.lock, etc.)
  const tomlChanged = changedFiles.some((file) => file.endsWith('.toml'));
  setOutput('toml-changed', tomlChanged ? 'true' : 'false');

  // Detect .mjs file changes (scripts)
  const mjsChanged = changedFiles.some((file) => file.endsWith('.mjs'));
  setOutput('mjs-changed', mjsChanged ? 'true' : 'false');

  // Detect .js file changes
  const jsChanged = changedFiles.some((file) => file.endsWith('.js'));
  setOutput('js-changed', jsChanged ? 'true' : 'false');

  // Detect package.json changes
  const packageChanged = changedFiles.some(
    (file) => file === 'js/package.json' || file === 'package.json'
  );
  setOutput('package-changed', packageChanged ? 'true' : 'false');

  // Detect documentation changes (any .md file)
  const docsChanged = changedFiles.some((file) => file.endsWith('.md'));
  setOutput('docs-changed', docsChanged ? 'true' : 'false');

  // Detect workflow changes
  const workflowChanged = changedFiles.some((file) =>
    file.startsWith('.github/workflows/')
  );
  setOutput('workflow-changed', workflowChanged ? 'true' : 'false');

  // Detect code changes (excluding docs, changesets, changelog.d, experiments, examples folders, and markdown files)
  const codeChangedFiles = changedFiles.filter(
    (file) => !isExcludedFromCodeChanges(file)
  );

  console.log('\nFiles considered as code changes:');
  if (codeChangedFiles.length === 0) {
    console.log('  (none)');
  } else {
    codeChangedFiles.forEach((file) => console.log(`  ${file}`));
  }
  console.log('');

  // Check if any code files changed
  const codePattern = /\.(rs|toml|mjs|js|json|yml|yaml)$|\.github\/workflows\//;
  const codeChanged = codeChangedFiles.some((file) => codePattern.test(file));
  setOutput('any-code-changed', codeChanged ? 'true' : 'false');

  // Check if any JS-specific code files changed
  const jsCodePattern = /\.(mjs|js|json)$/;
  const jsCodeChanged = codeChangedFiles.some(
    (file) => jsCodePattern.test(file) && file.startsWith('js/')
  );
  setOutput('js-code-changed', jsCodeChanged ? 'true' : 'false');

  // Check if any Rust-specific code files changed
  const rustCodePattern = /\.(rs|toml)$/;
  const rustCodeChanged = codeChangedFiles.some(
    (file) => rustCodePattern.test(file) && file.startsWith('rust/')
  );
  setOutput('rust-code-changed', rustCodeChanged ? 'true' : 'false');

  console.log('\nChange detection completed.');
}

// Run the detection
detectChanges();
