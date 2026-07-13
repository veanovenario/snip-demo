# snip CLI

Zero-dependency Node.js CLI for the [Snip](../backend) URL shortener.

Requires **Node ≥ 18** (uses global `fetch` and `child_process`).

---

## Installation

```bash
npm install -g .        # installs the `snip` binary globally
# or run without installing:
node cli.js <command>
```

---

## Commands

| Command | Description |
|---|---|
| `snip add <url>` | Shorten a URL; prints the short link |
| `snip ls` | List all links with code, hit count, and original URL |
| `snip open <code>` | Open the destination URL in your OS browser |
| `snip help` | Show usage |

---

## Examples

```bash
snip add https://example.com/very/long/path
# https://localhost:3000/abc123

snip ls
# CODE    HITS  URL
# abc123  4     https://example.com/very/long/path

snip open abc123
# opens https://example.com/very/long/path in your browser
```

---

## Configuration

| Variable | Default | Description |
|---|---|---|
| `SNIP_API` | `http://localhost:3000` | Backend base URL |

```bash
SNIP_API=https://snip.example.com snip ls
```

---

## Platform wrappers

| File | Platform |
|---|---|
| `snip` | macOS / Linux (sh) |
| `snip.cmd` | Windows CMD |
| `snip.ps1` | Windows PowerShell |

These wrappers exist for environments where `npm install -g` is not used.
Make the shell wrapper executable first: `chmod +x snip`.
