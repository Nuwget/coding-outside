# ADR-0004 (superseded): XChaCha20-Poly1305 derivado do nonce para E2E

## Status

**Superseded** por `adr-0004-noise-ik-handshake.md`.

## Motivo

O esquema proposto (Ed25519 estática + X25519 derivado do nonce + XChaCha20-Poly1305) tem dois problemas:

1. **Não é ECDH real** — o nonce não é segredo, então qualquer observador da LAN com a pubkey estática do Desk consegue derivar a mesma chave. Não é um handshake autenticado; é obfuscação.
2. **Sem Forward Secrecy** — se a chave estática do Desk vazar (flash dump), todas as sessões passadas podem ser decifradas por quem logou o WS.

## Substituto

Veja `docs/adr/0004-noise-ik-handshake.md`.
