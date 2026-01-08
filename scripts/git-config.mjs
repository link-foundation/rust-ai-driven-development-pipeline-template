#!/usr/bin/env node

/**
 * Configure git user for CI/CD pipeline
 *
 * This script sets up the git user name and email for automated commits.
 * It's used by the CI/CD pipeline before making commits.
 *
 * Usage: node scripts/git-config.mjs [--name <name>] [--email <email>]
 *
 * Uses link-foundation libraries:
 * - use-m: Dynamic package loading without package.json dependencies
 * - command-stream: Modern shell command execution with streaming support
 * - lino-arguments: Unified configuration from CLI args, env vars, and .lenv files
 */

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
    yargs
      .option('name', {
        type: 'string',
        default: getenv('GIT_USER_NAME', 'github-actions[bot]'),
        describe: 'Git user name',
      })
      .option('email', {
        type: 'string',
        default: getenv(
          'GIT_USER_EMAIL',
          'github-actions[bot]@users.noreply.github.com'
        ),
        describe: 'Git user email',
      }),
});

const { name, email } = config;

try {
  console.log(`Configuring git user: ${name} <${email}>`);

  await $`git config user.name ${name}`;
  await $`git config user.email ${email}`;

  console.log('Git configuration complete');
} catch (error) {
  console.error('Error configuring git:', error.message);
  process.exit(1);
}
