# Snip – Tiny URL Shortener (Backend)

A single-file Bun server with zero npm dependencies.

## Quick Start

```bash
bun run server.js
# or
bun start
```

## API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/links` | Create a short link. Body: `{ "url": "https://…" }` → 201 `{ code, url, shortUrl, hits, createdAt }` |
| `GET` | `/api/links` | List all links (array of the same shape) |
| `GET` | `/:code` | Redirect (302) to the original URL, incrementing `hits`; 404 if unknown |

### Error responses

- `400` – invalid JSON body or `url` is not a valid `http`/`https` URL
- `404` – short code not found

## Configuration (env vars)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | TCP port to listen on |
| `BASE_URL` | see below | Origin used in `shortUrl` values |
| `RAILWAY_PUBLIC_DOMAIN` | – | When `BASE_URL` is unset, used as `https://<domain>` |
| `PUBLIC_DIR` | – | Optional path; when set, static files are served from this folder (`/` → `index.html`). A matching file takes priority over a short code. |

`BASE_URL` resolution order: `BASE_URL` env → `https://$RAILWAY_PUBLIC_DOMAIN` → `http://localhost:$PORT`

## Short code format

6 random base-62 characters (`[0-9A-Za-z]`). Links are stored in an in-memory `Map`; data is lost on restart.

## CORS

All origins are allowed (`Access-Control-Allow-Origin: *`). `OPTIONS` preflight requests are handled automatically.
