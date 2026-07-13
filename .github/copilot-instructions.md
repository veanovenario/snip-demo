# snip-demo — AI Agent Instructions

> **Keep in sync with `CLAUDE.md`** — both files carry the
> same rule set. Edit one, mirror the change to the other in the same commit.

---

## What this repo is

A URL shortener structured as a **Git superproject** (`main` branch) that pins four
**orphan branches** as submodules. Each branch/layer has zero shared history with
the others.

---

## Layout & tech stack

| Submodule | Branch | Tech | Purpose |
|---|---|---|---|
| `backend/` | `backend` | Node ≥ 18, zero npm deps | REST API on port 3000 |
| `frontend/` | `frontend` | Angular 19, standalone components, signals | SPA on port 4200 |
| `cli/` | `cli` | CommonJS Node, zero npm deps | Terminal client |
| `bundle/` | `bundle` | Bun 1, oven/bun:1-alpine | **Generated** — assembled by CI |
| `scripts/` | `main` | Node ESM (`.mjs`) | `build-bundle.mjs` |
| `.github/` | `main` | GitHub Actions | `bundle.yml`, `docker.yml` |

---

## API contract — change everywhere or nowhere

All three clients (Angular service, CLI, and Docker image) depend on this shape.
Any change to URL structure, method, or response body must be applied to
`backend/server.js`, `frontend/src/app/snip.service.ts`, and `cli/cli.js`
simultaneously.

| Method | Path | Body | Success | Error |
|---|---|---|---|---|
| `POST` | `/api/links` | `{ url: string }` | `201 { code, url, shortUrl, hits, createdAt }` | `400 { error }` |
| `GET` | `/api/links` | — | `200 Link[]` | — |
| `GET` | `/:code` | — | `302 → url` | `404 { error }` |

---

## Key commands

```bash
# Clone (plain clone leaves submodule folders empty)
git clone -b main --recurse-submodules https://github.com/veanovenario/snip-demo

# Run backend (Node ≥ 18, no install needed)
node backend/server.js

# Run frontend dev server
cd frontend && npm install && npx ng serve

# Run CLI
node cli/cli.js help
node cli/cli.js add <url>
node cli/cli.js ls
node cli/cli.js open <code>

# Assemble bundle locally (no push)
node scripts/build-bundle.mjs

# Assemble + commit + push bundle branch and main
node scripts/build-bundle.mjs --push
```

---

## Edit → push → pointer-bump workflow

Work inside a submodule directory; commit and push to its branch; then bump
the superproject pointer:

```bash
cd backend          # or frontend/, cli/
# …make changes…
git add . && git commit -m "fix: …"
git push origin backend   # use the branch name, not HEAD

cd ..               # back in superproject (main)
git submodule update --remote backend
git add backend
git commit -m "chore: bump backend submodule"
git push
```

`bundle/` is **never** edited this way — it is assembled by `scripts/build-bundle.mjs`.

---

## Do / Don't

### bundle/ is generated output — never hand-edit

`bundle/` is written entirely by `scripts/build-bundle.mjs`. Any manual commit
there will be overwritten on the next CI build. To change what ends up in the
bundle, edit the source branch (`backend`, `frontend`, or `cli`) and re-run the
script.

### cli.js must stay CommonJS — no "type":"module" anywhere near it

`cli/package.json` intentionally omits `"type":"module"`. The `bundle/package.json`
(generated) also omits it. Adding `"type":"module"` to either breaks `node cli.js`
in CommonJS consumers. The CLI uses only `require()` and `module.exports` patterns.

### The Angular build output path is load-bearing

`scripts/build-bundle.mjs` hardcodes:
```
frontend/dist/snip-frontend/browser/index.html
```
The script aborts if that file is missing. Do not rename the Angular project
(`snip-frontend`) or change `outputPath` in `angular.json`.

### Storage is in-memory by design

`backend/server.js` stores links in a `Map`. Data is lost on restart. This is
intentional for the demo. To add persistence, add a DB — but do not refactor the
in-memory store unless you also update the bundle's server.js (via the script).

### bundle CI is schedule-only on purpose

`.github/workflows/bundle.yml` has **no push trigger**. The workflow file lives
only on `main`; a push trigger would only fire when `main` is pushed, never when
`backend`, `frontend`, or `cli` branches change. The hourly schedule picks up
those upstream commits automatically. Do not add a push trigger.

### docker CI watches the bundle gitlink, not files inside bundle/

`.github/workflows/docker.yml` path-filters on `bundle` (the submodule pointer
entry in the tree), not on `bundle/**`. It fires when `build-bundle.mjs --push`
bumps the pointer and pushes `main`. Do not change the path filter to `bundle/**`
— that would never match, because files inside a submodule are not visible to the
superproject's path filter.
