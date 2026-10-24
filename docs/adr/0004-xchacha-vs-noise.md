# ADR-0004: XChaCha20-Poly1305 vs Noise Protocol para E2E

## Contexto

Todo frame WebSocket entre Hub e Desk/Remote (depois do handshake) deve ser cifrado ponta-a-ponta. O handshake usa Ed25519 para autenticar o dispositivo; depois deriva-se uma chave simétrica para os frames.

## Decisão

Usar **XChaCha20-Poly1305** (via libsodium) para cifrar frames após o handshake. Não usamos Noise Protocol no MVP.

## Raciocínio

- libsodium está disponível em **todas** as plataformas do projeto: Node (`libsodium-wrappers`), Rust (`libsodium` / `rustls` + `sodiumoxide`), ESP-IDF (`esp-crypto`), navegador (Web Crypto / libsodium via WASM).
- XChaCha20-Poly1305 é nonce de 192 bits → seguro contra reuso de nonce aleatório (ideal para frames WS independentes).
- Noise Protocol é mais rico (handshake dinâmico, forward secrecy contínuo), mas adiciona complexidade de implementação em 4 stacks diferentes. O handshake Ed25519 + derivação via X25519 do nonce já cobre autenticação e confidencialidade iniciais.

## Consequências

- Chave simétrica derivada uma vez por sessão WS (do nonce do handshake).
- Não há rotação de chave por frame no MVP; adicionar se necessário em M10.
- Todo frame JSON-RPC é cifrado antes do envio; hub valida MAC antes de processar.

## Segurança

Antes de implementar M3/M4, confirmar com o usuário: geração de nonce, rotação de chave e armazenamento da chave privada Ed25519 no dispositivo.

## Status

Aceito — com ressalva de segurança aberta.
