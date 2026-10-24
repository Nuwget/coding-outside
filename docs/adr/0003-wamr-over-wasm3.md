# ADR-0003: WAMR em vez de wasm3 para Desk Apps no firmware

## Contexto

Desk Apps rodam no ESP32-S3 (firmware/desk) com LVGL. O SDK permite que desenvolvedores escrevam apps em TypeScript que compilam para WASM e são executados no Desk. Precisamos de um sandbox restrito (somente domínios em `permissions`, `storage.kv`, `ui.render`).

## Decisão

Usar **WAMR (ByteDance/Intel)** em vez de wasm3. WAMR tem port oficial ESP-IDF no registry de componentes, suporte a PSRAM, e está ativamente mantido.

## Raciocínio

| Critério | WAMR | wasm3 |
|---|---|---|
| Manutenção | Ativa (ByteDance/Intel) | Abandonada desde 2020 |
| Port ESP-IDF | Oficial (componente no registry) | Nenhum oficial |
| WASI preview1 | Coberto (`clock_time_get`, `random_get`, `fd_write`) | Não coberto |
| Host functions customizadas | `wasm_runtime_register_natives` documentado | API limitada |
| PSRAM | Suportado | Não |

## Detalhe importante

Não precisamos de WASI real. `http.fetch`, `storage.kv` e `ui.render` são **host functions customizadas**, não imports WASI. O que precisamos:
- Core wasm (integers, memory, tables) — WAMR cobre.
- WASI preview1 mínimo (`clock_time_get`, `random_get`, `fd_write` para debug) — WAMR cobre.
- Custom imports via `wasm_runtime_register_natives` — WAMR tem API bem documentada.

## Consequências

- Apps do SDK compilam para `wasm32-wasi`.
- No PC (desk-sim/Hub), o SDK roda via WAMR host runtime.
- No firmware, WAMR interpreta o módulo WASM com callbacks para as host functions.

## Status

Aceito — M7 implementa SDK + WAMR no firmware. Substitui `0003-wasm-vs-js-firmware.md`.
