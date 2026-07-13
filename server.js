// Snip – tiny URL shortener (Bun, zero npm deps)

const PORT = Number(process.env.PORT) || 3000;

function resolveBaseUrl() {
  if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/$/, "");
  if (process.env.RAILWAY_PUBLIC_DOMAIN)
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  return `http://localhost:${PORT}`;
}

const BASE_URL = resolveBaseUrl();
const PUBLIC_DIR = process.env.PUBLIC_DIR || null;

/** @type {Map<string, {code:string,url:string,shortUrl:string,hits:number,createdAt:string}>} */
const links = new Map();

const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function randomCode(len = 6) {
  let code = "";
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  for (const b of bytes) code += BASE62[b % 62];
  return code;
}

function isHttpUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

// Serve a static file from PUBLIC_DIR; returns null if not found/not readable.
async function serveStatic(pathname) {
  if (!PUBLIC_DIR) return null;
  // Normalise: strip query/fragment, prevent path traversal
  const safe = pathname.replace(/\?.*$/, "").replace(/\.\./g, "");
  let filePath = PUBLIC_DIR.replace(/\/$/, "") + (safe === "/" ? "/index.html" : safe);
  try {
    const file = Bun.file(filePath);
    if (!(await file.exists())) return null;
    return new Response(file, { headers: CORS_HEADERS });
  } catch {
    return null;
  }
}

async function handler(req) {
  const url = new URL(req.url);
  const { pathname } = url;

  // OPTIONS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // POST /api/links – create a short link
  if (req.method === "POST" && pathname === "/api/links") {
    let body;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }
    if (!body || typeof body.url !== "string" || !isHttpUrl(body.url)) {
      return json({ error: "url must be a valid http(s) URL" }, 400);
    }
    // Generate a unique code
    let code;
    do { code = randomCode(); } while (links.has(code));
    const entry = {
      code,
      url: body.url,
      shortUrl: `${BASE_URL}/${code}`,
      hits: 0,
      createdAt: new Date().toISOString(),
    };
    links.set(code, entry);
    return json(entry, 201);
  }

  // GET /api/links – list all links
  if (req.method === "GET" && pathname === "/api/links") {
    return json([...links.values()]);
  }

  // GET /:code – redirect
  if (req.method === "GET" && /^\/[A-Za-z0-9]{1,}$/.test(pathname)) {
    const code = pathname.slice(1);

    // Static file takes priority over short codes when PUBLIC_DIR is set
    const staticResp = await serveStatic(pathname);
    if (staticResp) return staticResp;

    const entry = links.get(code);
    if (!entry) return new Response("Not Found", { status: 404, headers: CORS_HEADERS });
    entry.hits++;
    return Response.redirect(entry.url, 302);
  }

  // Serve static assets for all other GET paths (e.g. "/index.html", "/app.js")
  if (req.method === "GET") {
    const staticResp = await serveStatic(pathname);
    if (staticResp) return staticResp;
  }

  return new Response("Not Found", { status: 404, headers: CORS_HEADERS });
}

const server = Bun.serve({ port: PORT, fetch: handler });
console.log(`Snip listening on ${BASE_URL} (port ${server.port})`);
