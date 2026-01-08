#!/usr/bin/env node

/**
 * Get the current version from Cargo.toml
 *
 * This script reads the version from Cargo.toml and outputs it
 * for use in GitHub Actions.
 *
 * Usage: node scripts/get-version.mjs
 *
 * Outputs (written to GITHUB_OUTPUT):
 *   - version: The current version from Cargo.toml
 */

import { readFileSync, appendFileSync } from 'fs';

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

try {
  const version = getCurrentVersion();
  console.log(`Current version: ${version}`);
  setOutput('version', version);
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
