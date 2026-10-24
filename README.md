# coding-outside

> Código fora da caixa, fora do expediente — e agora, fora da tela do computador.

[🇧🇷 Português](./README.md) · [🇺🇸 English](./README.en.md)

**🚧 Em construção** — o projeto começa no marco [M0](#roadmap): monorepo + protocolo + simulador da mesa no navegador.

**coding-outside** é um monitor de sessões de agentes de IA de programação — clone funcional do Miblo. Ele mostra em tempo real o que o Claude Code, Codex, Gemini CLI, Copilot CLI, OpenCode e Cursor estão fazendo: status de cada sessão, ação atual, tokens, custo e limites da API. E resolve o momento mais chato desse fluxo — **a sessão está esperando sua permissão** — com aprovação remota pelo celular ou pela mesa, sem voltar ao terminal.

## As peças

| Componente | O que é | Stack |
| --- | --- | --- |
| [`apps/hub`](./apps/hub) | App desktop central: dashboard de sessões, servidor WS, SQLite, pareamento | Tauri 2 (Rust) + React 18 |
| [`apps/remote`](./apps/remote) | PWA de bolso: sessões, limites e aprovação de permissões com WebAuthn | React 18 + Vite + Workbox |
| [`apps/desk-sim`](./apps/desk-sim) | Simulador da mesa (320×240, pixel-perfect) no navegador — **primeiro entregável** | React (dev only) |
| [`apps/web`](./apps/web) | Landing + checkout | Next.js 15 (App Router) |
| [`packages/protocol`](./packages/protocol) | Schemas Zod + tipos do protocolo WS (JSON-RPC 2.0) — fonte única de verdade | TypeScript |
| [`packages/cli-wrappers`](./packages/cli-wrappers) | Integração com cada CLI de IA (hooks, PTY, SSE) + daemon | Node + node-pty |
| [`packages/sdk`](./packages/sdk) | SDK para Desk Apps de terceiros, rodando em sandbox WASI | TS → `wasm32-wasi` |
| [`packages/apps-builtin`](./packages/apps-builtin) | Apps oficiais: bitcoin, clima, agenda, serviços, cpu-ram, planos | TypeScript |
| [`packages/ui`](./packages/ui) | Design system compartilhado | Tailwind + shadcn/ui |
| [`firmware/desk`](./firmware/desk) | Firmware do Desk (a mesa): telas LVGL, pets, apps | ESP-IDF 5.3 + LVGL 9 |

Monorepo com **pnpm workspaces + Turborepo**. `pnpm dev` sobe tudo, incluindo o desk-sim conectado ao Hub.

## Como funciona

1. **Interceptação** — cada CLI é integrada sem sobrescrever binários: Claude Code via hooks nativos (`PreToolUse`, `PostToolUse`, `Notification`, `Stop`); Codex via `notify` + wrapper PTY; Gemini/Copilot/Cursor via shims PTY em `~/.coding-outside/bin/`; OpenCode via servidor nativo (SSE).
2. **IPC local** — os eventos do wrapper vão por Unix socket (`/tmp/coding-outside.sock`) ou named pipe para o Hub, o único processo que fala com o mundo.
3. **Hub agrega** — status, tokens, custo, limites (5h/semanal) e histórico em SQLite; todo frame que atravessa IPC/WS é validado com Zod.
4. **Clientes remotos** — Desk e Remote descobrem o Hub por mDNS (`_coding-outside._tcp.local`), pareiam com um código de 6 dígitos e falam WebSocket na porta 8787 com envelope JSON-RPC 2.0 criptografado ponta a ponta.
5. **Aprovação remota** — quando uma sessão entra em `needs_you`, o comando aparece na mesa e no celular. Aprovar no celular exige WebAuthn (Face ID/digital/PIN). A resposta volta pelo mesmo caminho até o terminal do agente.

## Segurança

Criptografia e sandbox são decisões deliberadas, registradas em [ADRs](#decisões-arquiteturais-adrs):

- **Pareamento**: código de 6 dígitos (TTL 10 min) → handshake assinado Ed25519 → sessão WS com XChaCha20-Poly1305 (chave derivada do pareamento).
- **Remote**: aprovação de permissão sempre em duas etapas — desbloqueio ≠ autorização (WebAuthn obrigatório).
- **Relay (prod)**: o servidor Cloudflare roteia por `devicePubkey` e **não** consegue ler o payload.
- **Desk Apps**: sandbox WASI com permissões declaradas no manifest (`http:` por domínio, `storage:kv`); nada de acesso livre.
- **OTA**: assinado Ed25519 + código de 4 dígitos exibido na tela (anti-MITM) + rollback em caso de bootloop (>3).
- **Logs**: nunca logamos comandos ou tokens em nível info. Logs em `~/.coding-outside/logs/`, rotação de 7 dias e redaction de `*_key`, `token`, `authorization`.

## O Desk

Hardware alvo: **ESP32-S3-WROOM-1 N16R8** + **ST7789 320×240 SPI**.

Modos de tela (todos reproduzidos primeiro no desk-sim): `sessions`, `limits`, `focus` (Pomodoro 25/5), `meeting` (só hora + status — nada sensível), `message` (recado), `timer`, `countdown`, `pet`, `app` (widget de Desk App). Os estados críticos tomam a tela: permissão pendente entra em full-screen com botões **Negar/Aprovar** (ou hardware: BOOT curto = negar, longo = aprovar); limites mostram as 2 barras + "planeja estourar em X".

O modo `pet` é o coração da mesa: 20 mascotes (padrão: capivara), cores customizáveis por parte, acessórios, visitas entre mesas da rede e datas especiais — animado por spritesheet do LittleFS em canvas 16×16 escalado 4×, com shuffle bag de 30 animações.

## Ferramentas suportadas

| Ferramenta | Integração | Aprovação remota |
| --- | --- | --- |
| Claude Code | Hooks nativos no `settings.json` | ✅ (`permissionDecision` no hook) |
| Codex | `notify` no `config.toml` + wrapper PTY (`--approval-mode suggest`) | ✅ |
| OpenCode | `opencode serve` (SSE `/events`) | ✅ |
| Gemini CLI | Shim PTY com regex de prompt | ✅ |
| Copilot CLI | Shim PTY com regex de prompt | ✅ |
| Cursor | Shim PTY com regex de prompt | ✅ |

Testes de parser rodam contra fixtures reais em `packages/cli-wrappers/__fixtures__/`.

## Começando

Pré-requisitos: Node 20 LTS, pnpm 9, Rust 1.78+, ESP-IDF 5.3 (só para firmware).

```bash
pnpm install
pnpm dev        # Hub + Remote + Desk Simulator no navegador
pnpm test       # Vitest
pnpm lint       # zero warnings esperado
pnpm --filter hub tauri dev   # app desktop em modo dev
```

Firmware:

```bash
cd firmware/desk
idf.py build flash monitor
```

## Roadmap

- [ ] **M0** — Monorepo + `@coding-outside/protocol` + desk-sim (dados mock). O maior unlock.
- [ ] **M1** — Hub (Tauri): SQLite, servidor WS, dashboard; desk-sim conecta no Hub real.
- [ ] **M2** — Wrappers: Claude Code (hooks) e Codex (notify), aprovação end-to-end.
- [ ] **M3** — Remote PWA: pareamento, lista, aprovação WebAuthn, resposta.
- [ ] **M4** — Firmware: Wi-Fi + mDNS + WS + tela de sessões.
- [ ] **M5** — Firmware: telas permission/focus/meeting/message/timer/countdown.
- [ ] **M6** — Pets.
- [ ] **M7** — SDK + 3 apps builtin + wasm3 no firmware.
- [ ] **M8** — Wrappers para Gemini/Copilot/OpenCode/Cursor.
- [ ] **M9** — Landing (`apps/web`) + checkout (Mercado Pago/Stripe).
- [ ] **M10** — Relay cloud, push, OTA assinado, hardening.

## Decisões arquiteturais (ADRs)

Antes de qualquer código pesado, `docs/adr/` registra o porquê de:

1. **Tauri vs Electron** — por que o Hub é Tauri 2 e não um Electron.
2. **Hooks vs PTY** — por que Claude Code usa hooks nativos e as outras CLIs usam wrapper PTY.
3. **WASM vs JS no firmware** — por que Desk Apps rodam em sandbox WASI/wasm3.
4. **XChaCha vs Noise** — por que XChaCha20-Poly1305 no transporte e não um protocolo Noise completo.

Decisões que afetam segurança (cripto, sandbox, OTA) são discutidas antes de implementadas — não depois.

## Convenções

Este repositório segue o guia de engenharia vivo do próprio repo — [`AGENTS.md`](./AGENTS.md):

- Conventional Commits (um propósito por commit), PRs pequenos com a história completa.
- TypeScript strict com `pnpm lint` zero warnings; parsers de CLI testados com Vitest + fixtures reais.
- Rust com `cargo clippy -- -D warnings`; firmware com build reproduzível e teste de bootloop.
- Simples antes de esperto, validação na borda, segredo nunca no repositório.

## License

Ainda não definida — decisão junto do lançamento.

---

*coding-outside* carrega o "fora" em três sentidos: **fora da caixa** (o problema define a solução), **fora do expediente** (o código sai quando a cidade dorme) e **fora do computador** — o monitor acompanha o programador na mesa, no celular e fora do escritório.
