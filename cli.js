#!/usr/bin/env node
'use strict';

const { execSync } = require('child_process');

const BASE = (process.env.SNIP_API || 'http://localhost:3000').replace(/\/$/, '');

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

async function api(path, options) {
  const url = BASE + path;
  let res;
  try {
    res = await fetch(url, options);
  } catch (err) {
    die(`Cannot reach backend at ${BASE}: ${err.message}`);
  }
  return res;
}

async function apiJson(path, options) {
  const res = await api(path, options);
  let body;
  try {
    body = await res.json();
  } catch {
    die(`Server returned non-JSON response (HTTP ${res.status})`);
  }
  if (!res.ok) {
    die(body.error || `Server error: HTTP ${res.status}`);
  }
  return body;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function die(msg) {
  process.stderr.write('error: ' + msg + '\n');
  process.exit(1);
}

function openBrowser(url) {
  const cmds = { darwin: 'open', win32: 'start', linux: 'xdg-open' };
  const cmd = cmds[process.platform] || 'xdg-open';
  try {
    execSync(`${cmd} "${url}"`, { stdio: 'ignore' });
  } catch (err) {
    die(`Could not open browser: ${err.message}`);
  }
}

// Column-align a list of rows (array of string arrays)
function table(rows) {
  if (rows.length === 0) return '';
  const widths = rows[0].map((_, ci) =>
    Math.max(...rows.map(r => String(r[ci] ?? '').length))
  );
  return rows
    .map(r => r.map((cell, ci) => String(cell ?? '').padEnd(widths[ci])).join('  ').trimEnd())
    .join('\n');
}

// ─── Commands ─────────────────────────────────────────────────────────────────

async function cmdAdd(url) {
  if (!url) die('Usage: snip add <url>');
  if (!/^https?:\/\//i.test(url)) die('URL must start with http:// or https://');

  const link = await apiJson('/api/links', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  process.stdout.write(link.shortUrl + '\n');
}

async function cmdLs() {
  const links = await apiJson('/api/links');

  if (!links.length) {
    process.stdout.write('No links yet.\n');
    return;
  }

  const header = ['CODE', 'HITS', 'URL'];
  const rows = links.map(l => [l.code, String(l.hits), l.url]);
  process.stdout.write(table([header, ...rows]) + '\n');
}

async function cmdOpen(code) {
  if (!code) die('Usage: snip open <code>');

  const res = await api(`/${code}`, { redirect: 'manual' });

  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get('location');
    if (!location) die('Redirect received but Location header is missing.');
    openBrowser(location);
    return;
  }

  if (res.status === 404) die(`Unknown short code: ${code}`);
  die(`Unexpected response: HTTP ${res.status}`);
}

function printHelp() {
  process.stdout.write(
    'snip — URL shortener CLI\n' +
    '\n' +
    'Usage:\n' +
    '  snip add <url>    Shorten a URL and print the short link\n' +
    '  snip ls           List all shortened links\n' +
    '  snip open <code>  Open the destination of a short code in your browser\n' +
    '  snip help         Show this message\n' +
    '\n' +
    'Environment:\n' +
    '  SNIP_API          Backend base URL (default: http://localhost:3000)\n'
  );
}

// ─── Entry point ──────────────────────────────────────────────────────────────

const [,, cmd, arg] = process.argv;

(async () => {
  switch (cmd) {
    case 'add':  await cmdAdd(arg);  break;
    case 'ls':   await cmdLs();     break;
    case 'open': await cmdOpen(arg); break;
    case 'help':
    case undefined:
      printHelp();
      break;
    default:
      process.stderr.write(`error: unknown command "${cmd}"\n\n`);
      printHelp();
      process.exit(1);
  }
})();
