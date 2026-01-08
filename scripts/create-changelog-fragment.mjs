#!/usr/bin/env node

/**
 * Create a changelog fragment for manual release PR
 *
 * This script creates a changelog fragment with the appropriate
 * category based on the bump type.
 *
 * Usage: node scripts/create-changelog-fragment.mjs --bump-type <type> [--description <desc>]
 *
 * Uses link-foundation libraries:
 * - use-m: Dynamic package loading without package.json dependencies
 * - lino-arguments: Unified configuration from CLI args, env vars, and .lenv files
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Load use-m dynamically
const { use } = eval(
  await (await fetch('https://unpkg.com/use-m/use.js')).text()
);

// Import lino-arguments for CLI argument parsing
const { makeConfig } = await use('lino-arguments');

// Parse CLI arguments
const config = makeConfig({
  yargs: ({ yargs, getenv }) =>
    yargs
      .option('bump-type', {
        type: 'string',
        default: getenv('BUMP_TYPE', 'patch'),
        describe: 'Version bump type',
        choices: ['major', 'minor', 'patch'],
      })
      .option('description', {
        type: 'string',
        default: getenv('DESCRIPTION', ''),
        describe: 'Release description',
      }),
});

const { bumpType, description } = config;

/**
 * Get the changelog category based on bump type
 * @param {string} bumpType
 * @returns {string}
 */
function getCategory(bumpType) {
  switch (bumpType) {
    case 'major':
      return '### Breaking Changes';
    case 'minor':
      return '### Added';
    case 'patch':
      return '### Fixed';
    default:
      return '### Changed';
  }
}

/**
 * Generate a timestamp-based filename
 * @returns {string}
 */
function generateTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

try {
  const changelogDir = 'changelog.d';
  const timestamp = generateTimestamp();
  const fragmentFile = join(changelogDir, `${timestamp}-manual-${bumpType}.md`);

  // Determine changelog category based on bump type
  const category = getCategory(bumpType);

  // Create changelog fragment with frontmatter
  const descriptionText = description || `Manual ${bumpType} release`;
  const fragmentContent = `---
bump: ${bumpType}
---

${category}

- ${descriptionText}
`;

  // Ensure changelog.d directory exists
  if (!existsSync(changelogDir)) {
    mkdirSync(changelogDir, { recursive: true });
  }

  // Write the fragment file
  writeFileSync(fragmentFile, fragmentContent, 'utf-8');

  console.log(`Created changelog fragment: ${fragmentFile}`);
  console.log('');
  console.log('Content:');
  console.log(fragmentContent);
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
