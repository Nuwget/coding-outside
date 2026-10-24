# coding-outside

> Code outside the box, outside office hours — and now, outside the computer screen.

[🇧🇷 Português](./README.md) · [🇺🇸 English](./README.en.md)

**🚧 Under construction** — the project starts at milestone [M0](#roadmap): monorepo + protocol + the desk simulator in the browser.

**coding-outside** is a monitor for AI coding agent sessions — a functional clone of Miblo. It shows in real time what Claude Code, Codex, Gemini CLI, Copilot CLI, OpenCode and Cursor are doing: per-session status, current action, tokens, cost and API limits. And it fixes the most annoying moment of that loop — **the session is waiting for your permission** — with remote approval from your phone or desk, without going back to the terminal.

## The pieces

| Component | What it is | Stack |
| --- | --- | --- |
| [`apps/hub`](./apps/hub) | Central desktop app: session dashboard, WS server, SQLite, pairing | Tauri 2 (Rust) + React 18 |
| [`apps/remote`](./apps/remote) | Pocket PWA: sessions, limits and permission approval with WebAuthn | React 18 + Vite + Workbox |
| [`apps/desk-sim`](./apps/desk-sim) | Browser-based simulator of the Desk (320×240, pixel-perfect) — **first deliverable** | React (dev only) |
| [`apps/web`](./apps/web) | Landing page + checkout | Next.js 15 (App Router) |
| [`packages/protocol`](./packages/protocol) | Zod schemas + types for the WS protocol (JSON-RPC 2.0) — single source of truth | TypeScript |
| [`packages/cli-wrappers`](./packages/cli-wrappers) | Integration with each AI CLI (hooks, PTY, SSE) + daemon | Node + node-pty |
| [`packages/sdk`](./packages/sdk) | SDK for third-party Desk Apps, running in a WASI sandbox | TS → `wasm32-wasi` |
| [`packages/apps-builtin`](./packages/apps-builtin) | Official apps: bitcoin, weather, agenda, uptime, cpu-ram, usage plans | TypeScript |
| [`packages/ui`](./packages/ui) | Shared design system | Tailwind + shadcn/ui |
| [`firmware/desk`](./firmware/desk) | Desk firmware: LVGL screens, pets, apps | ESP-IDF 5.3 + LVGL 9 |

Monorepo with **pnpm workspaces + Turborepo**. `pnpm dev` brings everything up, including the desk simulator connected to the Hub.

## How it works

1. **Interception** — each CLI is integrated without overwriting binaries: Claude Code via native hooks (`PreToolUse`, `PostToolUse`, `Notification`, `Stop`); Codex via `notify` + PTY wrapper; Gemini/Copilot/Cursor via PTY shims in `~/.coding-outside/bin/`; OpenCode via its native server (SSE).
2. **Local IPC** — wrapper events travel over a Unix socket (`/tmp/coding-outside.sock`) or named pipe to the Hub, the only process that talks to the world.
3. **Hub aggregates** — status, tokens, cost, limits (5h/weekly) and history in SQLite; every frame that crosses IPC/WS is validated with Zod.
4. **Remote clients** — the Desk and the Remote discover the Hub via mDNS (`_coding-outside._tcp.local`), pair with a 6-digit code and talk WebSocket on port 8787 with end-to-end encrypted JSON-RPC 2.0 envelopes.
5. **Remote approval** — when a session hits `needs_you`, the command shows up on the desk and the phone. Approving on the phone requires WebAuthn (Face ID/fingerprint/PIN). The answer travels back along the same path to the agent's terminal.

## Security

Crypto and sandbox choices are deliberate, recorded in [ADRs](#architectural-decision-records-adrs):

- **Pairing**: 6-digit code (10 min TTL) → Ed25519-signed handshake → WS session with XChaCha20-Poly1305 (key derived from the pairing).
- **Remote**: permission approval is always two separate steps — unlocking ≠ authorizing (mandatory WebAuthn).
- **Relay (prod)**: the Cloudflare server routes by `devicePubkey` and **cannot** read the payload.
- **Desk Apps**: WASI sandbox with permissions declared in the manifest (`http:` per domain, `storage:kv`); no open access.
- **OTA**: Ed25519-signed + 4-digit code shown on the screen (anti-MITM) + rollback on bootloop (>3).
- **Logs**: commands and tokens are never logged at info level. Logs live in `~/.coding-outside/logs/`, 7-day rotation, with redaction of `*_key`, `token`, `authorization`.

## The Desk

Target hardware: **ESP32-S3-WROOM-1 N16R8** + **ST7789 320×240 SPI**.

Screen modes (all reproduced in the desk-sim first): `sessions`, `limits`, `focus` (25/5 Pomodoro), `meeting` (time + status only — nothing sensitive), `message` (short note), `timer`, `countdown`, `pet`, `app` (Desk App widget). Critical states take over the screen: a pending permission goes full-screen with **Deny/Approve** buttons (or hardware: short BOOT = deny, long BOOT = approve); limits show both bars + "projected to run out in X".

The `pet` mode is the heart of the desk: 20 mascots (default: capybara), per-part color customization, accessories, visits between desks on the network and special dates — animated from a LittleFS spritesheet on a 16×16 canvas scaled 4×, with a 30-animation shuffle bag.

## Supported tools

| Tool | Integration | Remote approval |
| --- | --- | --- |
| Claude Code | Native hooks in `settings.json` | ✅ (`permissionDecision` in the hook) |
| Codex | `notify` in `config.toml` + PTY wrapper (`--approval-mode suggest`) | ✅ |
| OpenCode | `opencode serve` (SSE `/events`) | ✅ |
| Gemini CLI | PTY shim with prompt regex | ✅ |
| Copilot CLI | PTY shim with prompt regex | ✅ |
| Cursor | PTY shim with prompt regex | ✅ |

Parser tests run against real fixtures in `packages/cli-wrappers/__fixtures__/`.

## Getting started

Prerequisites: Node 20 LTS, pnpm 9, Rust 1.78+, ESP-IDF 5.3 (firmware only).

```bash
pnpm install
pnpm dev        # Hub + Remote + Desk Simulator in the browser
pnpm test       # Vitest
pnpm lint       # zero warnings expected
pnpm --filter hub tauri dev   # desktop app in dev mode
```

Firmware:

```bash
cd firmware/desk
idf.py build flash monitor
```

## Roadmap

- [ ] **M0** — Monorepo + `@coding-outside/protocol` + desk-sim (mock data). The biggest unlock.
- [ ] **M1** — Hub (Tauri): SQLite, WS server, dashboard; desk-sim connects to the real Hub.
- [ ] **M2** — Wrappers: Claude Code (hooks) and Codex (notify), end-to-end approval.
- [ ] **M3** — Remote PWA: pairing, session list, WebAuthn approval, reply.
- [ ] **M4** — Firmware: Wi-Fi + mDNS + WS + sessions screen.
- [ ] **M5** — Firmware: permission/focus/meeting/message/timer/countdown screens.
- [ ] **M6** — Pets.
- [ ] **M7** — SDK + 3 built-in apps + wasm3 on the firmware.
- [ ] **M8** — Wrappers for Gemini/Copilot/OpenCode/Cursor.
- [ ] **M9** — Landing (`apps/web`) + checkout (Mercado Pago/Stripe).
- [ ] **M10** — Cloud relay, push, signed OTA, hardening.

## Architectural decision records (ADRs)

Before any heavy code, `docs/adr/` records the why behind:

1. **Tauri vs Electron** — why the Hub is Tauri 2 and not an Electron app.
2. **Hooks vs PTY** — why Claude Code uses native hooks while the other CLIs get PTY wrappers.
3. **WASM vs JS on the firmware** — why Desk Apps run in a WASI/wasm3 sandbox.
4. **XChaCha vs Noise** — why XChaCha20-Poly1305 on the transport instead of a full Noise protocol.

Decisions that affect security (crypto, sandbox, OTA) are discussed before implementation — never after.

## Conventions

This repository follows its own living engineering guide — [`AGENTS.md`](./AGENTS.md):

- Conventional Commits (one purpose per commit), small PRs with the full story.
- TypeScript strict with `pnpm lint` at zero warnings; CLI parsers tested with Vitest + real fixtures.
- Rust with `cargo clippy -- -D warnings`; firmware with reproducible builds and a bootloop test.
- Simple before clever, validation at the boundary, secrets never in the repository.

## License

Not decided yet — will be settled at launch.

---

*coding-outside* carries "outside" in three senses: **outside the box** (the problem defines the solution), **outside office hours** (the code ships when the city sleeps) and **outside the computer** — the monitor follows the developer on the desk, on the phone and away from the office.
