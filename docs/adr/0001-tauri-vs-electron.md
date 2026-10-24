# ADR-0001: Tauri 2 vs Electron para o Hub

## Contexto

O Hub precisa:
- Rodar um servidor WebSocket na porta 8787 (bind `0.0.0.0`).
- Usar SQLite local via `better-sqlite3` (nativo) com migrações Drizzle.
- Exibir ícone na bandeja do sistema (system tray) com menu de sessões.
- Chamar comandos Rust (IPC, cripto, pareamento, instalação de apps .coapp).
- Ser leve o suficiente para ficar sempre em execução em segundo plano.

## Decisão

Usar **Tauri 2 (Rust + React + Vite)**. Não Electron.

## Raciocínio

| Critério | Tauri 2 | Electron |
|---|---|---|
| Tamanho do instalador | Alguns MB (WebView do sistema) | ~150 MB (Chromium embarcado) |
| Memória idle | Baixa | Alta |
| Acesso nativo/Rust | Comandos Tauri diretos | Node child_process / native addons |
| SQLite nativo | `better-sqlite3` no Rust/Node | `better-sqlite3` no Node |
| System tray | API nativa do Tauri | `tray` do Electron (mais pesado) |
| Segurança | Isolamento por contexto + allowlist | Mais superfície de ataque (Chromium full) |

## Consequências

- O frontend do Hub é uma webview leve; toda lógica sensível (WS server, cripto, SQLite) vive no Rust.
- Build multiplataforma (macOS/Linux/Windows) via `cargo-tauri`.
- Desvantagem: ecossistema de plugins menor que Electron; precisamos de `tauri-plugin-sql` ou acesso direto via Rust.

## Status

Aceito — M1 implementa o Hub em Tauri 2.
