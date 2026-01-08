#!/usr/bin/env node

/**
 * Check if a release is needed based on changelog fragments and version state
 *
 * This script checks:
 * 1. If there are changelog fragments to process
 * 2. If the current version has already been released (tagged)
 *
 * Usage: node scripts/check-release-needed.mjs
 *
 * Environment variables:
 *   - HAS_FRAGMENTS: 'true' if changelog fragments exist (from get-bump-type.mjs)
 *
 * Outputs (written to GITHUB_OUTPUT):
 *   - should_release: 'true' if a release should be created
 *   - skip_bump: 'true' if version bump should be skipped (version not yet released)
 *
 * Uses link-foundation libraries:
 * - use-m: Dynamic package loading without package.json dependencies
 * - command-stream: Modern shell command execution with streaming support
 * - lino-arguments: Unified configuration from CLI args, env vars, and .lenv files
 */

import { readFileSync, appendFileSync } from 'fs';

// Load use-m dynamically
const { use } = eval(
  await (await fetch('https://unpkg.com/use-m/use.js')).text()
);

// Import link-foundation libraries
const { $ } = await use('command-stream');
const { makeConfig } = await use('lino-arguments');

// Parse CLI arguments and env vars
const config = makeConfig({
  yargs: ({ yargs, getenv }) =>
    yargs.option('has-fragments', {
      type: 'string',
      default: getenv('HAS_FRAGMENTS', 'false'),
      describe: 'Whether changelog fragments exist',
    }),
});

const { hasFragments } = config;

/**
 * Append to GitHub Actions output file
 * @param {string} key
 * @param {string} value
 */
function setOutput(key, value) {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    appendFileSync(outputFile, `${key}=${value}\n`);
  }
  console.log(`Output: ${key}=${value}`);
}

/**
 * Get current version from Cargo.toml
 * @returns {string}
 */
function getCurrentVersion() {
  const cargoToml = readFileSync('Cargo.toml', 'utf-8');
  const match = cargoToml.match(/^version\s*=\s*"([^"]+)"/m);

  if (!match) {
    console.error('Error: Could not find version in Cargo.toml');
    process.exit(1);
  }

  return match[1];
}

/**
 * Check if a git tag exists for this version
 * @param {string} version
 * @returns {Promise<boolean>}
 */
async function checkTagExists(version) {
  try {
    await $`git rev-parse v${version}`.run({ capture: true });
    return true;
  } catch {
    return false;
  }
}

async function main() {
  try {
    const fragmentsExist = hasFragments === 'true';

    if (!fragmentsExist) {
      // No fragments - check if current version tag exists
      const currentVersion = getCurrentVersion();
      const tagExists = await checkTagExists(currentVersion);

      if (tagExists) {
        console.log(
          `No changelog fragments and v${currentVersion} already released`
        );
        setOutput('should_release', 'false');
      } else {
        console.log(
          `No changelog fragments but v${currentVersion} not yet released`
        );
        setOutput('should_release', 'true');
        setOutput('skip_bump', 'true');
      }
    } else {
      console.log('Found changelog fragments, proceeding with release');
      setOutput('should_release', 'true');
      setOutput('skip_bump', 'false');
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
