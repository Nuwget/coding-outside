# ADR-0003: WASM (wasm3) vs JS engine para Desk Apps no firmware

## Contexto

Desk Apps rodam no ESP32-S3 (firmware/desk) com LVGL. O SDK permite que desenvolvedores escrevam apps em TypeScript que compilam para WASM e são executados no Desk. Precisamos de um sandbox restrito (somente domínios em `permissions`, `storage.kv`, `ui.render`).

## Decisão

Usar **WASM via wasm3** no firmware, com API WASI-lite. Não embarcamos engine JS (QuickJS/Duktape) no firmware.

## Raciocínio

| Critério | wasm3 (WASM) | QuickJS/Duktape (JS) |
|---|---|---|
| Memória flash/RAM | Muito baixa (ideal para MCU) | Maior |
| Segurança | Sandbox WASI nativo | Precisa de restrições manuais |
| Linguagem do dev | TS → wasm32-wasi | TS → JS bundler |
| Ecosystem AssemblyScript | Limitado, mas suficiente para apps simples | Amplo (npm) |
| Suporte ESP-IDF | Exemplo foi para usar litex-wasm / wasm3 | Mais maduro em C |

## Consequências

- Apps do SDK compilam para `wasm32-wasi` (via AssemblyScript ou foi em C).
- No PC (desk-sim/Hub), o SDK roda via `@wasmer/wasi` ou wasm3 porta para host.
- No firmware, `wasm3` interpreta o módulo WASM com callbacks para `http.fetch`, `storage.kv`, `ui.render`.

## Status

Aceito — M7 implementa SDK + wasm3 no firmware.
