# ADR-0004: Noise IK handshake para E2E no WebSocket

## Contexto

Todo frame WebSocket entre Hub e Desk/Remote (depois do handshake) deve ser cifrado ponta-a-ponta com autenticação mútua e forward secrecy. O Desk já conhece a pubkey estática do Hub (foi pareada com ela).

## Decisão

Usar **Noise Protocol pattern IK** (Interactive, initiator knows static public key do responder). Lib `snow` no Hub (Rust) e `noise-protocol` no Desk-sim/Remote (Node). Não usamos XChaCha-from-nonce.

## Raciocínio

- IK dá 1 round-trip, auth mútuo, forward secrecy por sessão. É battle-tested (WireGuard, etc.).
- O Desk é o initiator (já conhece a pubkey estática do Hub). IK encaixa perfeito.
- Para Remote↔Hub com pareamento por código de 6 dígitos, usamos **KK** (Remote gera par efêmero na hora, Hub confirma). Ambos suportados pelo `snow` sem mudar código.
- Rekey por frame: não. O Noise cuida do rekey interno (2⁶⁴ mensagens). Sem nonce/counter artesanal.
- `snow` (Rust) e `noise-protocol` (Node) estão disponíveis em todas as stacks do projeto.

## Consequências

- Handshake autenticado + FS desde o MVP. Economiza retrabalho no M10.
- Custo: ~1 dia a mais no M3/M4.
- Antes de implementar M3/M4, confirmar com o usuário: geração de nonce, rotação de chave e armazenamento da chave privada Ed25519 no dispositivo.

## Chaves (decisão tomada agora, não M10)

| Onde | Storage | Ação imediata |
|---|---|---|
| Hub | OS keychain via `tauri-plugin-keyring` (macOS Keychain, Win Credential Manager, libsecret) | **Fazer no M1.** Nunca SQLite em plaintext. |
| Desk | ESP32 NVS (texto plano) + Secure Boot v2 + Flash Encryption | NVS no M4. Secure Boot/Flash Enc no M10. |
| Remote | WebCrypto non-extractable `CryptoKey` em IndexedDB, envelopado por chave derivada de WebAuthn | Fazer no M3, junto com o pareamento. |

## Status

Aceito — substitui `0004-xchacha-vs-noise.md`.
