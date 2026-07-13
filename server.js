// Snip – tiny URL shortener (Node.js ≥ 18, zero npm deps)
'use strict';

const http = require('node:http');
const fs   = require('node:fs/promises');
const path = require('node:path');

const PORT = Number(process.env.PORT) || 3000;

function resolveBaseUrl() {
  if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/$/, '');
  if (process.env.RAILWAY_PUBLIC_DOMAIN)
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  return `http://localhost:${PORT}`;
}

const BASE_URL  = resolveBaseUrl();
const PUBLIC_DIR = process.env.PUBLIC_DIR || null;

/** @type {Map<string, {code:string,url:string,shortUrl:string,hits:number,createdAt:string}>} */
const links = new Map();

const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function randomCode(len = 6) {
  // crypto.getRandomValues is global in Node ≥ 19 (Node 26 is confirmed installed)
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  let code = '';
  for (const b of bytes) code += BASE62[b % 62];
  return code;
}

function isHttpUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch { return false; }
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function sendJson(res, data, status = 200) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json', ...CORS_HEADERS });
  res.end(body);
}

function sendText(res, text, status = 200, extra = {}) {
  res.writeHead(status, { 'Content-Type': 'text/plain', ...CORS_HEADERS, ...extra });
  res.end(text);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(raw)); }
      catch { reject(Object.assign(new Error('Invalid JSON'), { status: 400 })); }
    });
    req.on('error', reject);
  });
}

// Serve a static file from PUBLIC_DIR; returns true if served, false otherwise.
async function serveStatic(res, pathname) {
  if (!PUBLIC_DIR) return false;
  const safe    = pathname.replace(/\?.*$/, '');
  const absRoot = path.resolve(PUBLIC_DIR);
  const absFile = path.resolve(path.join(absRoot, safe === '/' ? 'index.html' : safe));
  // Path-traversal guard
  if (!absFile.startsWith(absRoot + path.sep) && absFile !== absRoot) return false;
  try {
    const data = await fs.readFile(absFile);
    const ext  = path.extname(absFile).toLowerCase();
    const mime = { '.html':'text/html', '.js':'application/javascript',
                   '.css':'text/css',   '.ico':'image/x-icon',
                   '.json':'application/json' }[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime, ...CORS_HEADERS });
    res.end(data);
    return true;
  } catch { return false; }
}

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, `http://localhost:${PORT}`);

  // OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  // POST /api/links
  if (req.method === 'POST' && pathname === '/api/links') {
    let body;
    try { body = await readBody(req); }
    catch { return sendJson(res, { error: 'Invalid JSON' }, 400); }
    if (!body || typeof body.url !== 'string' || !isHttpUrl(body.url))
      return sendJson(res, { error: 'url must be a valid http(s) URL' }, 400);
    let code;
    do { code = randomCode(); } while (links.has(code));
    const entry = { code, url: body.url,
                    shortUrl: `${BASE_URL}/${code}`,
                    hits: 0, createdAt: new Date().toISOString() };
    links.set(code, entry);
    return sendJson(res, entry, 201);
  }

  // GET /api/links
  if (req.method === 'GET' && pathname === '/api/links') {
    return sendJson(res, [...links.values()]);
  }

  // GET /:code – redirect
  if (req.method === 'GET' && /^\/[A-Za-z0-9]+$/.test(pathname)) {
    const code = pathname.slice(1);
    // Static file takes priority when PUBLIC_DIR is set
    if (await serveStatic(res, pathname)) return;
    const entry = links.get(code);
    if (!entry) return sendText(res, 'Not Found', 404);
    entry.hits++;
    res.writeHead(302, { Location: entry.url, ...CORS_HEADERS });
    res.end();
    return;
  }

  // Serve other static assets
  if (req.method === 'GET') {
    if (await serveStatic(res, pathname)) return;
  }

  sendText(res, 'Not Found', 404);
});

server.listen(PORT, () => {
  console.log(`Snip listening on ${BASE_URL} (port ${PORT})`);
});
