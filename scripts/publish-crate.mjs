#!/usr/bin/env node

/**
 * Publish package to crates.io
 *
 * This script publishes the Rust package to crates.io and handles
 * the case where the version already exists.
 *
 * Supports both single-language and multi-language repository structures:
 * - Single-language: Cargo.toml in repository root
 * - Multi-language: Cargo.toml in rust/ subfolder
 *
 * Usage: node scripts/publish-crate.mjs [--token <token>] [--rust-root <path>]
 *
 * Environment variables (checked in order of priority):
 *   - CARGO_REGISTRY_TOKEN: Cargo's native crates.io token (preferred)
 *   - CARGO_TOKEN: Alternative token name for backwards compatibility
 *
 * Outputs (written to GITHUB_OUTPUT):
 *   - publish_result: 'success', 'already_exists', or 'failed'
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
  needsCd,
  parseRustRootConfig,
} from './rust-paths.mjs';

// Load use-m dynamically
const { use } = eval(
  await (await fetch('https://unpkg.com/use-m/use.js')).text()
);

// Import link-foundation libraries
const { $ } = await use('command-stream');
const { makeConfig } = await use('lino-arguments');

// Parse CLI arguments
// Support both CARGO_REGISTRY_TOKEN (cargo's native env var) and CARGO_TOKEN (backwards compat)
const config = makeConfig({
  yargs: ({ yargs, getenv }) =>
    yargs
      .option('token', {
        type: 'string',
        default: getenv('CARGO_REGISTRY_TOKEN', '') || getenv('CARGO_TOKEN', ''),
        describe: 'Crates.io API token (defaults to CARGO_REGISTRY_TOKEN or CARGO_TOKEN env var)',
      })
      .option('rust-root', {
        type: 'string',
        default: getenv('RUST_ROOT', ''),
        describe: 'Rust package root directory (auto-detected if not specified)',
      }),
});

const { token, rustRoot: rustRootArg } = config;

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
 * Get package info from Cargo.toml
 * @returns {{name: string, version: string}}
 */
function getPackageInfo() {
  const cargoToml = readFileSync(CARGO_TOML, 'utf-8');

  const nameMatch = cargoToml.match(/^name\s*=\s*"([^"]+)"/m);
  const versionMatch = cargoToml.match(/^version\s*=\s*"([^"]+)"/m);

  if (!nameMatch || !versionMatch) {
    console.error(`Error: Could not parse package info from ${CARGO_TOML}`);
    process.exit(1);
  }

  return {
    name: nameMatch[1],
    version: versionMatch[1],
  };
}

async function main() {
  // Store the original working directory to restore after cd commands
  // IMPORTANT: command-stream's cd is a virtual command that calls process.chdir()
  const originalCwd = process.cwd();

  try {
    const { name, version } = getPackageInfo();
    console.log(`Package: ${name}@${version}`);
    console.log('');
    console.log('=== Attempting to publish to crates.io ===');

    if (!token) {
      console.log(
        '::warning::Neither CARGO_REGISTRY_TOKEN nor CARGO_TOKEN is set, attempting publish without explicit token'
      );
      console.log('');
      console.log('To fix this, ensure one of the following secrets is configured:');
      console.log('  - CARGO_REGISTRY_TOKEN (Cargo\'s native env var, preferred)');
      console.log('  - CARGO_TOKEN (alternative for backwards compatibility)');
      console.log('');
      console.log('For organization secrets, you may need to map the secret name in your workflow:');
      console.log('  env:');
      console.log('    CARGO_REGISTRY_TOKEN: ${{ secrets.CARGO_TOKEN }}');
      console.log('');
    } else {
      // Log that we have a token (masked in CI logs)
      console.log('Using provided authentication token');
    }

    try {
      // For multi-language repos, we need to cd into the rust directory
      // IMPORTANT: cd is a virtual command that calls process.chdir(), so we restore after
      if (needsCd({ rustRoot })) {
        if (token) {
          await $`cd ${rustRoot} && cargo publish --token ${token} --allow-dirty`;
        } else {
          await $`cd ${rustRoot} && cargo publish --allow-dirty`;
        }
        process.chdir(originalCwd);
      } else {
        if (token) {
          await $`cargo publish --token ${token} --allow-dirty`;
        } else {
          await $`cargo publish --allow-dirty`;
        }
      }

      console.log(`Successfully published ${name}@${version} to crates.io`);
      setOutput('publish_result', 'success');
    } catch (error) {
      // Restore cwd on error
      if (needsCd({ rustRoot })) {
        process.chdir(originalCwd);
      }

      const errorMessage = error.message || '';

      if (
        errorMessage.includes('already uploaded') ||
        errorMessage.includes('already exists')
      ) {
        console.log(
          `Version ${version} already exists on crates.io - this is OK`
        );
        setOutput('publish_result', 'already_exists');
      } else if (
        errorMessage.includes('non-empty token') ||
        errorMessage.includes('please provide a') ||
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('authentication')
      ) {
        // Explicit authentication failure handling
        console.error('');
        console.error('=== AUTHENTICATION FAILURE ===');
        console.error('');
        console.error('Failed to publish due to missing or invalid authentication token.');
        console.error('');
        console.error('SOLUTION: Configure one of these secrets in your repository or organization:');
        console.error('  1. CARGO_REGISTRY_TOKEN - Cargo\'s native environment variable (preferred)');
        console.error('  2. CARGO_TOKEN - Alternative name for backwards compatibility');
        console.error('');
        console.error('If using organization secrets with a different name, map it in your workflow:');
        console.error('  - name: Publish to Crates.io');
        console.error('    env:');
        console.error('      CARGO_REGISTRY_TOKEN: ${{ secrets.YOUR_SECRET_NAME }}');
        console.error('');
        console.error('See: https://doc.rust-lang.org/cargo/reference/publishing.html');
        console.error('');
        setOutput('publish_result', 'auth_failed');
        process.exit(1);
      } else {
        console.error('Failed to publish for unknown reason');
        console.error(errorMessage);
        setOutput('publish_result', 'failed');
        process.exit(1);
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
