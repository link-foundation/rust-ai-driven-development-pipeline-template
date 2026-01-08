#!/usr/bin/env node

/**
 * Publish package to crates.io
 *
 * This script publishes the Rust package to crates.io and handles
 * the case where the version already exists.
 *
 * Usage: node scripts/publish-crate.mjs [--token <token>]
 *
 * Environment variables:
 *   - CARGO_TOKEN: The crates.io API token
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

// Load use-m dynamically
const { use } = eval(
  await (await fetch('https://unpkg.com/use-m/use.js')).text()
);

// Import link-foundation libraries
const { $ } = await use('command-stream');
const { makeConfig } = await use('lino-arguments');

// Parse CLI arguments
const config = makeConfig({
  yargs: ({ yargs, getenv }) =>
    yargs.option('token', {
      type: 'string',
      default: getenv('CARGO_TOKEN', ''),
      describe: 'Crates.io API token',
    }),
});

const { token } = config;

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
  const cargoToml = readFileSync('Cargo.toml', 'utf-8');

  const nameMatch = cargoToml.match(/^name\s*=\s*"([^"]+)"/m);
  const versionMatch = cargoToml.match(/^version\s*=\s*"([^"]+)"/m);

  if (!nameMatch || !versionMatch) {
    console.error('Error: Could not parse package info from Cargo.toml');
    process.exit(1);
  }

  return {
    name: nameMatch[1],
    version: versionMatch[1],
  };
}

async function main() {
  try {
    const { name, version } = getPackageInfo();
    console.log(`Package: ${name}@${version}`);
    console.log('');
    console.log('=== Attempting to publish to crates.io ===');

    try {
      if (token) {
        await $`cargo publish --token ${token} --allow-dirty`;
      } else {
        await $`cargo publish --allow-dirty`;
      }

      console.log(`Successfully published ${name}@${version} to crates.io`);
      setOutput('publish_result', 'success');
    } catch (error) {
      const errorMessage = error.message || '';

      if (
        errorMessage.includes('already uploaded') ||
        errorMessage.includes('already exists')
      ) {
        console.log(
          `Version ${version} already exists on crates.io - this is OK`
        );
        setOutput('publish_result', 'already_exists');
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
