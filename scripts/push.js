/**
 * Pushes the current branch to GitHub using the token in your .env file.
 *
 * Usage: npm run push
 *
 * The token is read from .env at run time and handed to git through an
 * environment variable. It is never written to .git/config, never committed,
 * and never printed.
 */

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const ENV_FILE = path.join(ROOT, '.env');

function fail(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}

function readEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  const env = {};
  for (const rawLine of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
    env[key] = value;
  }
  return env;
}

function git(args, options = {}) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', ...options }).trim();
}

const fileEnv = readEnvFile(ENV_FILE);
const token = process.env.GITHUB_TOKEN || fileEnv.GITHUB_TOKEN;

if (!token) {
  fail(
    [
      'No GITHUB_TOKEN found.',
      '',
      '1. Copy .env.example to .env',
      '2. Create a token at https://github.com/settings/tokens?type=beta',
      '   (repository access: mesura, permission: Contents = Read and write)',
      '3. Paste it after GITHUB_TOKEN= in your .env file, then run this again.',
    ].join('\n')
  );
}

const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
const remoteUrl = git(['remote', 'get-url', 'origin']);
const match = remoteUrl.match(/github\.com[/:]([^/]+)\/(.+?)(?:\.git)?$/);

if (!match) fail(`Could not read a GitHub owner/repo out of the origin remote: ${remoteUrl}`);
const [, owner, repo] = match;

// The credential helper receives the token via the environment, so the token
// never appears in the remote URL or in any command line.
const helper = `!f() { echo username=${owner}; echo "password=$GITHUB_TOKEN"; }; f`;

console.log(`Pushing ${branch} to ${owner}/${repo} ...`);

try {
  git(['-c', `credential.helper=${helper}`, 'push', '-u', 'origin', `${branch}:${branch}`], {
    stdio: 'inherit',
    env: { ...process.env, GITHUB_TOKEN: token, GIT_TERMINAL_PROMPT: '0' },
  });
} catch {
  fail(
    [
      'Push failed. The usual causes:',
      '',
      `- The repository https://github.com/${owner}/${repo} does not exist yet.`,
      '  Create it on GitHub (empty, with no README) and run this again.',
      '- The token has expired, or lacks "Contents: Read and write" on this repository.',
      '- The repository already has commits. Run "git pull --rebase origin main" first.',
    ].join('\n')
  );
}

console.log(`\nDone. https://github.com/${owner}/${repo}`);
