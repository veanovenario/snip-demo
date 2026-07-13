#!/usr/bin/env node
/**
 * scripts/build-bundle.mjs
 *
 * Assembles the snip-demo "bundle" submodule from the three source branches,
 * commits, and (with --push) pushes both the bundle branch and the superproject.
 *
 * Usage:
 *   node scripts/build-bundle.mjs           # assemble + commit locally
 *   node scripts/build-bundle.mjs --push    # also push both remotes
 *
 * Safe no-op: if nothing changed since the last build, no commits are created.
 * Works on macOS, Linux, and Windows (Node ≥ 18, zero npm deps).
 */

import { execFileSync, execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// ─── Paths ────────────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT    = resolve(join(__dirname, '..'));
const BACKEND = join(ROOT, 'backend');
const FRONTEND= join(ROOT, 'frontend');
const CLI_DIR = join(ROOT, 'cli');
const BUNDLE  = join(ROOT, 'bundle');

const PUSH = process.argv.includes('--push');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function step(msg) { console.log(`\n▶  ${msg}`); }

/** Run a command, streaming output. Throws on non-zero exit. */
function run(cmd, args, cwd = ROOT) {
  console.log(`  $ ${cmd} ${args.join(' ')}`);
  execFileSync(cmd, args, { cwd, stdio: 'inherit' });
}

/** Run a command and return trimmed stdout. */
function capture(cmd, args, cwd = ROOT) {
  return execFileSync(cmd, args, { cwd, encoding: 'utf8' }).trim();
}

/**
 * Returns true if there are staged changes in cwd.
 * git diff --cached --quiet exits 1 when staged diffs exist, 0 when clean.
 */
function hasStagedChanges(cwd) {
  try {
    execFileSync('git', ['diff', '--cached', '--quiet'], { cwd, stdio: 'pipe' });
    return false;
  } catch {
    return true;
  }
}

// ─── Step 1: Update source submodules to branch tips ─────────────────────────

step('Updating source submodules to branch tips…');
run('git', ['submodule', 'update', '--init', '--remote', 'backend', 'frontend', 'cli']);

// ─── Step 2: Build frontend ───────────────────────────────────────────────────

step('Installing frontend dependencies…');
run('npm', ['install'], FRONTEND);

step('Building Angular frontend…');
// Use shell: true only here so npx resolves correctly on all platforms
execSync('npx ng build', { cwd: FRONTEND, stdio: 'inherit', shell: true });

const INDEX_HTML = join(FRONTEND, 'dist', 'snip-frontend', 'browser', 'index.html');
if (!existsSync(INDEX_HTML)) {
  console.error(`\n✘  Build verification failed: ${INDEX_HTML} not found.`);
  process.exit(1);
}
console.log('  ✔  index.html confirmed at dist/snip-frontend/browser/index.html');

// ─── Step 3: Assemble bundle/ ────────────────────────────────────────────────

step('Assembling bundle/…');

// server.js
cpSync(join(BACKEND, 'server.js'), join(BUNDLE, 'server.js'));
console.log('  copied backend/server.js → bundle/server.js');

// cli.js
cpSync(join(CLI_DIR, 'cli.js'), join(BUNDLE, 'cli.js'));
console.log('  copied cli/cli.js        → bundle/cli.js');

// public/ (full replace to keep it in sync with the build)
const SRC_PUBLIC = join(FRONTEND, 'dist', 'snip-frontend', 'browser');
const DST_PUBLIC = join(BUNDLE, 'public');
if (existsSync(DST_PUBLIC)) rmSync(DST_PUBLIC, { recursive: true, force: true });
mkdirSync(DST_PUBLIC, { recursive: true });
cpSync(SRC_PUBLIC, DST_PUBLIC, { recursive: true });
console.log('  copied frontend dist     → bundle/public/');

// .env — Bun auto-loads this; switches the server into "also serve the SPA" mode
writeFileSync(join(BUNDLE, '.env'), 'PUBLIC_DIR=./public\n', 'utf8');
console.log('  wrote bundle/.env');

// package.json — no "type" field → cli.js still runs under plain `node`
writeFileSync(
  join(BUNDLE, 'package.json'),
  JSON.stringify(
    {
      name: 'snip-bundle',
      version: '1.0.0',
      description: 'Snip — single-process bundle (backend + SPA + CLI)',
      scripts: { start: 'bun server.js' },
      engines: { bun: '>=1.0.0' },
    },
    null,
    2
  ) + '\n',
  'utf8'
);
console.log('  wrote bundle/package.json');

// Dockerfile
writeFileSync(
  join(BUNDLE, 'Dockerfile'),
  [
    'FROM oven/bun:1-alpine',
    'WORKDIR /app',
    'COPY . .',
    'ENV PORT=3000',
    'EXPOSE 3000',
    'CMD bun server.js',
    '',
  ].join('\n'),
  'utf8'
);
console.log('  wrote bundle/Dockerfile');

// .dockerignore
writeFileSync(
  join(BUNDLE, '.dockerignore'),
  ['node_modules', '.git', ''].join('\n'),
  'utf8'
);
console.log('  wrote bundle/.dockerignore');

// railway.json
writeFileSync(
  join(BUNDLE, 'railway.json'),
  JSON.stringify(
    {
      $schema: 'https://railway.app/railway.schema.json',
      build: { builder: 'DOCKERFILE', dockerfilePath: 'Dockerfile' },
    },
    null,
    2
  ) + '\n',
  'utf8'
);
console.log('  wrote bundle/railway.json');

// ─── Step 4: Commit inside bundle/ ───────────────────────────────────────────

step('Committing inside bundle/…');
run('git', ['add', '-A'], BUNDLE);

if (hasStagedChanges(BUNDLE)) {
  const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
  run('git', ['commit', '-m', `chore: build bundle ${ts}`], BUNDLE);
  console.log('  ✔  bundle/ committed');
} else {
  console.log('  ✔  bundle/: nothing to commit (no-op)');
}

// ─── Step 5: Bump bundle submodule pointer in superproject ────────────────────

step('Bumping bundle submodule pointer in superproject…');
run('git', ['add', 'bundle'], ROOT);

if (hasStagedChanges(ROOT)) {
  run('git', ['commit', '-m', 'chore: bump bundle submodule'], ROOT);
  console.log('  ✔  superproject pointer bumped');
} else {
  console.log('  ✔  superproject: nothing to commit (no-op)');
}

// ─── Step 6: Push (--push only) ───────────────────────────────────────────────

if (PUSH) {
  step('Pushing bundle branch…');
  // Submodule checkout is detached; push to the named branch explicitly
  run('git', ['push', 'origin', 'HEAD:bundle'], BUNDLE);

  step('Pushing superproject main…');
  run('git', ['push'], ROOT);

  console.log('\n✔  All pushes complete.');
} else {
  console.log('\n✔  Build complete (local only). Re-run with --push to publish.');
}
