#!/usr/bin/env node

/**
 * Check if a release is needed based on changelog fragments and version state
 *
 * This script checks:
 * 1. If there are changelog fragments to process
 * 2. If the current version has already been published to crates.io
 *
 * IMPORTANT: This script checks crates.io (the source of truth for Rust packages),
 * NOT git tags. This is critical because:
 * - Git tags can exist without the package being published
 * - GitHub releases create tags but don't publish to crates.io
 * - Only crates.io publication means users can actually install the package
 *
 * See: https://github.com/link-foundation/browser-commander/issues/29
 *
 * Supports both single-language and multi-language repository structures:
 * - Single-language: Cargo.toml in repository root
 * - Multi-language: Cargo.toml in rust/ subfolder
 *
 * Usage: node scripts/check-release-needed.mjs [--rust-root <path>]
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
import {
  getRustRoot,
  getCargoTomlPath,
  parseRustRootConfig,
} from './rust-paths.mjs';

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
    yargs
      .option('has-fragments', {
        type: 'string',
        default: getenv('HAS_FRAGMENTS', 'false'),
        describe: 'Whether changelog fragments exist',
      })
      .option('rust-root', {
        type: 'string',
        default: getenv('RUST_ROOT', ''),
        describe: 'Rust package root directory (auto-detected if not specified)',
      }),
});

const { hasFragments, rustRoot: rustRootArg } = config;

// Get Rust package root (auto-detect or use explicit config)
const rustRootConfig = rustRootArg || parseRustRootConfig();
const rustRoot = getRustRoot({ rustRoot: rustRootConfig || undefined, verbose: true });

// Get paths based on detected/configured rust root
const CARGO_TOML = getCargoTomlPath({ rustRoot });

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
  const cargoToml = readFileSync(CARGO_TOML, 'utf-8');
  const match = cargoToml.match(/^version\s*=\s*"([^"]+)"/m);

  if (!match) {
    console.error(`Error: Could not find version in ${CARGO_TOML}`);
    process.exit(1);
  }

  return match[1];
}

/**
 * Get crate name from Cargo.toml
 * @returns {string}
 */
function getCrateName() {
  const cargoToml = readFileSync(CARGO_TOML, 'utf-8');
  const match = cargoToml.match(/^name\s*=\s*"([^"]+)"/m);

  if (!match) {
    console.error(`Error: Could not find name in ${CARGO_TOML}`);
    process.exit(1);
  }

  return match[1];
}

/**
 * Check if a version is published on crates.io
 *
 * This is the source of truth for whether a Rust package version is released.
 * Git tags can exist without the package being published (e.g., failed publish,
 * GitHub-only releases), so we must check crates.io directly.
 *
 * @param {string} crateName - The crate name
 * @param {string} version - The version to check
 * @returns {Promise<boolean>} - True if the version exists on crates.io
 */
async function checkVersionOnCratesIo(crateName, version) {
  try {
    const response = await fetch(
      `https://crates.io/api/v1/crates/${crateName}/${version}`
    );

    if (!response.ok) {
      // 404 means version doesn't exist on crates.io
      if (response.status === 404) {
        return false;
      }
      console.log(
        `Warning: crates.io API returned ${response.status} for ${crateName}@${version}`
      );
      return false;
    }

    const data = await response.json();
    // If we got a valid response with a version field, it exists
    return !!data.version;
  } catch (error) {
    console.log(`Warning: Could not check crates.io: ${error.message}`);
    // On error, fall back to assuming it's not published
    // This is safer than incorrectly skipping a release
    return false;
  }
}

async function main() {
  try {
    const fragmentsExist = hasFragments === 'true';

    if (!fragmentsExist) {
      // No fragments - check if current version is published on crates.io
      const crateName = getCrateName();
      const currentVersion = getCurrentVersion();
      const isPublished = await checkVersionOnCratesIo(crateName, currentVersion);

      console.log(
        `Crate: ${crateName}, Version: ${currentVersion}, Published on crates.io: ${isPublished}`
      );

      if (isPublished) {
        console.log(
          `No changelog fragments and v${currentVersion} already published on crates.io`
        );
        setOutput('should_release', 'false');
      } else {
        console.log(
          `No changelog fragments but v${currentVersion} not yet published to crates.io`
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
