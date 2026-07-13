# snip-demo

A URL shortener built as three independent layers, each living on its own orphan
branch and mounted here as a Git submodule.

```
snip-demo (main)
├── backend/    ← branch: backend  — Node/Express API
├── frontend/   ← branch: frontend — Angular 19 SPA
└── cli/        ← branch: cli      — zero-dependency Node CLI
```

---

## Architecture

```
Browser / CLI
     │
     ▼
Angular SPA  ◄──────────────────────────────┐
(port 4200)                                 │ http://localhost:3000
                                            │
CLI (snip add / ls / open)  ───────────────►│
                                            │
                               Express API (port 3000)
                               POST /api/links  { url }
                               GET  /api/links
                               GET  /:code  → 302 redirect
```

One backend, two clients — the Angular UI and the CLI talk to the same REST API.
All state lives in the backend's in-memory store (replace with a DB to persist).

---

## API Contract

| Method | Path | Body / Params | Success | Error |
|---|---|---|---|---|
| `POST` | `/api/links` | `{ url: string }` | `201 { code, url, shortUrl, hits, createdAt }` | `400 { error }` |
| `GET` | `/api/links` | — | `200 [ …Link ]` | — |
| `GET` | `/:code` | path param | `302` → original URL | `404 { error }` |

---

## Repository layout

Each layer is an **orphan branch** with no shared history.
The `main` branch (this file) only contains `.gitmodules` and this README —
it acts as an aggregator that pins each submodule to a specific commit.

| Branch | Contents |
|---|---|
| `backend` | `server.js`, `package.json` |
| `frontend` | Angular 19 app (`src/`, `angular.json`, …) |
| `cli` | `cli.js`, `package.json`, shell wrappers |
| `main` | `.gitmodules`, `README.md` (this file) |

---

## Cloning

A plain `git clone` leaves the submodule folders empty. Always use:

```bash
git clone --recurse-submodules https://github.com/veanovenario/snip-demo
```

If you already cloned without the flag:

```bash
git submodule update --init --recursive
```

---

## Running all three pieces

### 1 — Backend (Node ≥ 18, Express)

```bash
cd backend
npm install
node server.js          # listens on http://localhost:3000
```

### 2 — Frontend (Node ≥ 18, Angular CLI)

```bash
cd frontend
npm install
npx ng serve            # dev server at http://localhost:4200
# or build for production:
npx ng build            # output → dist/snip-frontend/browser
```

### 3 — CLI (Node ≥ 18, no install needed)

```bash
# run directly
node cli/cli.js add https://example.com

# or install globally from the submodule folder
cd cli && npm install -g .
snip add https://example.com
snip ls
snip open <code>
```

Set `SNIP_API` to point at a non-local backend:

```bash
SNIP_API=https://snip.example.com snip ls
```

---

## Updating a submodule

Work happens inside the submodule directory and is pushed to its own branch.
The superproject then records the new commit pointer.

```bash
# 1. Make changes inside the submodule
cd backend
# …edit, test…
git add .
git commit -m "fix: something"
git push origin backend

# 2. Back in the superproject, advance the pointer
cd ..
git submodule update --remote backend
git add backend
git commit -m "chore: bump backend submodule"
git push
```

To advance **all** submodules at once:

```bash
git submodule update --remote
git add .
git commit -m "chore: bump all submodules"
git push
```
