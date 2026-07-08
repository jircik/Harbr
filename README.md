# Harbr

> Local port dashboard — inspect and kill active ports from your browser.

Harbr is a zero-config CLI that scans the ports open on your machine and serves a clean web dashboard for viewing and killing the processes behind them. Run one command, get a live view of every listening port, and reclaim a stuck port with a single click.

---

## Features

- **One-command launch** — `npx @jircik/harbr` starts a local dashboard and opens your browser.
- **Live port inventory** — every listening TCP/UDP port with its protocol, PID, process name, and bind address.
- **Well-known port labels** — recognizes common services (HTTP, PostgreSQL, Redis, MongoDB, and more) and tags them automatically.
- **One-click kill** — terminate a process straight from the dashboard.
- **No database, no config** — reads live system state on every request.
- **Small footprint** — a thin Express server plus an embedded HTML/CSS/JS frontend.

---

## Requirements

- **Node.js** ≥ 18
- **Linux** — Harbr reads port data via the `ss` command (`iproute2`), which is standard on modern Linux distributions.

> **Platform note:** port scanning currently relies on `ss -tulnp`. macOS and Windows are not yet supported.

---

## Installation

Run without installing:

```bash
npx @jircik/harbr
```

Or install globally:

```bash
npm install -g @jircik/harbr
harbr
```

---

## Usage

```bash
harbr [options]
```

Launch Harbr and it will start the dashboard, print the URL, and open your browser automatically:

```
  Harbr running at http://localhost:4444

   Press Ctrl+C to stop.
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `-p, --port <number>` | Port to serve the Harbr dashboard on | `4444` |
| `--no-open` | Do not open the browser automatically | — |
| `-V, --version` | Print the version number | — |
| `-h, --help` | Show help | — |

### Examples

```bash
# Serve the dashboard on a custom port
harbr --port 8000

# Start without launching a browser (e.g. on a remote/headless box)
harbr --no-open
```

---

## How it works

Harbr has four small pieces:

1. **`ports.ts`** — runs `ss -tulnp`, parses the output, and returns a typed `PortEntry[]` (port, protocol, PID, process name, address, and a label for known ports).
2. **`kill.ts`** — terminates a process by PID via `kill -9`, with error handling for invalid or missing processes.
3. **`server.ts`** — an Express app exposing the JSON API and serving the dashboard.
4. **`ui.ts`** — the dashboard frontend, embedded as a single HTML/CSS/JS string (no build step, no assets to ship).
5. **`cli.ts`** — the entry point: parses flags with Commander, starts the server, and opens the browser.

### API

The dashboard is driven by a tiny HTTP API you can also call directly:

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/` | Serves the dashboard HTML |
| `GET` | `/api/ports` | Returns the active ports as JSON (`PortEntry[]`) |
| `DELETE` | `/api/ports/:pid` | Kills the process with the given PID |

**`PortEntry` shape:**

```ts
interface PortEntry {
  port: number;
  protocol: string;      // e.g. "tcp", "udp"
  pid: number;
  processName: string;
  localAddress: string;
  label: string;         // e.g. "PostgreSQL", or "" if unknown
}
```

**Example — kill a process by PID:**

```bash
curl -X DELETE http://localhost:4444/api/ports/12345
# → { "success": true }
```

---

## Development

```bash
# Install dependencies
npm install

# Run from source (no build)
npm run dev

# Compile TypeScript to dist/
npm run build
```

The project is written in TypeScript and compiles to `dist/` via `tsc`. The `build` script also marks `dist/cli.js` executable so it works as a `bin`.

### Project layout

```
src/
  cli.ts      CLI entry point (Commander flags, server start, auto-open)
  server.ts   Express server + API routes
  ports.ts    ss parser → typed PortEntry[]
  kill.ts     kill process by PID
  ui.ts       embedded dashboard (HTML/CSS/JS)
```

---

## Security

Harbr binds to `localhost` and can terminate processes on your machine via the `DELETE /api/ports/:pid` endpoint. Do not expose the dashboard port to untrusted networks — anyone who can reach it can kill processes running as your user.

---

## License

MIT
