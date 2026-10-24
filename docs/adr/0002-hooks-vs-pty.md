# ADR-0002: Hooks nativos (Claude Code) vs PTY (outros CLIs)

## Contexto

O `@coding-outside/cli-wrappers` deve capturar sessões de agentes de IA e traduzir para eventos do protocolo. Cada ferramenta tem um mecanismo diferente de extensibilidade:

- Claude Code: hooks nativos (`settings.json`).
- Codex: `notify` + `approval-mode suggest`.
- Gemini CLI / Copilot CLI / Cursor: sem API de eventos estável → PTY shim.
- OpenCode: servidor nativo (`opencode serve`) com SSE `/events`.

## Decisão

- **Claude Code → hooks nativos** (mais confiável, sem interceptar stdout).
- **Codex → `notify` + wrapper PTY para aprovações.**
- **Gemini/Copilot/Cursor → wrapper PTY puro (`node-pty`).**
- **OpenCode → API nativa SSE.**

## Raciocínio

Hooks nativos dão eventos estruturados (JSON no stdin) e decisões de permissão (`permissionDecision`) sem adivinhação de regex. PTY é fallback para ferramentas que não expõem API; requer detecção por regex de prompt de permissão e é mais frágil (quebra em mudança de UI do CLI). OpenCode tem servidor oficial — usar SSE é mais robusto que PTY.

## Consequências

- O shim nunca sobrescreve binários reais; fica em `~/.coding-outside/bin/` antes no PATH.
- Testes Vitest com fixtures reais em `packages/cli-wrappers/__fixtures__/` para cada parser de CLI.
- PTY só em Linux/macOS no MVP; Windows via named pipe (fase posterior).

## Status

Aceito — M2 implementa Claude Code (hooks) e Codex (notify).
