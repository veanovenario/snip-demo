# snip-demo — bundle branch

**This branch contains generated output. Do not hand-edit.**

It is assembled by `scripts/build-bundle.mjs` in the `main` superproject and
pushed automatically. Direct commits here will be overwritten on the next build.

Contents produced by the build script:
- `server.js` — backend server (copied from the `backend` branch)
- `cli.js`    — CLI tool (copied from the `cli` branch)
- `public/`   — compiled Angular SPA (built from the `frontend` branch)
- `.env`       — `PUBLIC_DIR=./public` (Bun auto-loads; enables serving the SPA)
- `package.json` — `"start": "bun server.js"` entry point
- `Dockerfile` / `.dockerignore` / `railway.json` — deployment config
