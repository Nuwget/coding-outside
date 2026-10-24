import { z } from "zod";

/* ========================================================================
   Enums base
   ======================================================================== */

export const ToolSchema = z.enum([
  "claude-code",
  "codex",
  "gemini-cli",
  "copilot-cli",
  "opencode",
  "cursor-agent",
]);
export type Tool = z.infer<typeof ToolSchema>;

export const SessionStatus = z.enum([
  "idle",
  "working",
  "needs_you",
  "done",
  "error",
  "offline",
]);
export type SessionStatus = z.infer<typeof SessionStatus>;

export const PermissionRisk = z.enum(["low", "medium", "high"]);
export type PermissionRisk = z.infer<typeof PermissionRisk>;

export const DeskMode = z.enum([
  "sessions",
  "focus",
  "meeting",
  "message",
  "timer",
  "countdown",
  "pet",
  "app",
]);
export type DeskMode = z.infer<typeof DeskMode>;

export const PetSpecies = z.enum([
  "capybara",
  "bear",
  "cat",
  "dog",
  "fox",
]);
export type PetSpecies = z.infer<typeof PetSpecies>;

export const ClientKind = z.enum(["desk", "remote", "desk-sim"]);
export type ClientKind = z.infer<typeof ClientKind>;

/* ========================================================================
   Modelo de dados
   ======================================================================== */

export const PermissionSchema = z.object({
  reqId: z.string(),
  command: z.string(),
  tool: z.string(), // "Bash", "Edit", "Read"
  cwd: z.string(),
  expiresAt: z.number(),
  risk: PermissionRisk.default("medium"),
});
export type Permission = z.infer<typeof PermissionSchema>;

export const Session = z.object({
  id: z.string().uuid(),
  rev: z.number().int().nonnegative(),
  tool: ToolSchema,
  status: SessionStatus,
  cwd: z.string(),
  label: z.string().max(80), // ex: "loja · auth fix"
  startedAt: z.number(),
  lastEventAt: z.number(),
  tokensIn: z.number().default(0),
  tokensOut: z.number().default(0),
  costUsd: z.number().default(0),
  currentAction: z.string().optional(), // ex: "Edit src/auth.ts"
  pendingPermission: PermissionSchema.optional(),
});
export type Session = z.infer<typeof Session>;

export const Limits = z.object({
  fiveHour: z.object({
    pct: z.number(),
    resetAt: z.number(),
  }),
  weekly: z.object({
    pct: z.number(),
    resetAt: z.number(),
  }),
  plan: z.string().optional(), // "max", "pro", ...
});
export type Limits = z.infer<typeof Limits>;

export const DeskAppManifest = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  version: z.string(),
  refresh_sec: z.number().min(5).max(3600),
  permissions: z.array(z.string()), // "http:api.coingecko.com", "storage:kv"
  entry: z.string().default("main.wasm"),
  ui: z.object({
    width: z.number().default(320),
    height: z.number().default(240),
  }),
});
export type DeskAppManifest = z.infer<typeof DeskAppManifest>;

/* ========================================================================
   WebSocket — envelope com versão de protocolo
   ======================================================================== */

/* Todo frame WS começa com { v: 1, type: "..." }. O type distingue:
   - "hello"   : cliente se apresenta ao conectar (device.hello)
   - "rpc"     : cliente → hub (JSON-RPC request)
   - "event"   : hub → cliente (evento do protocolo)
   - "error"   : erro JSON-RPC (qualquer direção)
*/

/* --- Cliente → Hub: device.hello --- */

export const ClientHello = z.object({
  v: z.literal(1),
  type: z.literal("hello"),
  deviceId: z.string().uuid(),
  clientKind: ClientKind,
  protocolV: z.literal(1),
  capabilities: z.object({
    screenW: z.number().optional(),
    screenH: z.number().optional(),
    pets: z.boolean().default(false),
    apps: z.boolean().default(false),
    touch: z.boolean().default(false),
  }),
});
export type ClientHello = z.infer<typeof ClientHello>;

/* --- Cliente → Hub: RPC request (tipagem frouxa no wire) --- */

export const ClientRpc = z.object({
  v: z.literal(1),
  type: z.literal("rpc"),
  id: z.string(),
  method: z.string(),
  params: z.record(z.string(), z.unknown()),
});
export type ClientRpc = z.infer<typeof ClientRpc>;

/* --- Hub → Cliente: evento (tipagem frouxa no wire) --- */

export const ServerEvent = z.object({
  v: z.literal(1),
  type: z.literal("event"),
  event: z.string(),
  data: z.any(),
});
export type ServerEvent = z.infer<typeof ServerEvent>;

/* --- Erro JSON-RPC (qualquer direção) --- */

export const JsonRpcError = z.object({
  v: z.literal(1),
  type: z.literal("error"),
  id: z.string().optional(),
  error: z.object({
    code: z.number(),
    message: z.string(),
    data: z.unknown().optional(),
  }),
});
export type JsonRpcError = z.infer<typeof JsonRpcError>;

/* --- Frame completo do wire --- */

export const WsFrame = z.discriminatedUnion("type", [
  ClientHello,
  ClientRpc,
  ServerEvent,
  JsonRpcError,
]);
export type WsFrame = z.infer<typeof WsFrame>;

/* ========================================================================
   Schemas tipados (uso interno do Hub e clientes)
   ======================================================================== */

/* --- Hub → Cliente: eventos tipados --- */

export const SessionUpsertEvent = z.object({
  event: z.literal("session.upsert"),
  data: Session,
});
export const SessionRemoveEvent = z.object({
  event: z.literal("session.remove"),
  data: z.object({ id: z.string().uuid() }),
});
export const SessionPermissionEvent = z.object({
  event: z.literal("session.permission"),
  data: z.object({
    sessionId: z.string().uuid(),
    permission: PermissionSchema,
  }),
});
export const SessionDoneEvent = z.object({
  event: z.literal("session.done"),
  data: z.object({
    id: z.string().uuid(),
    durationMs: z.number(),
    tokens: z.number(),
  }),
});
export const LimitsUpdateEvent = z.object({
  event: z.literal("limits.update"),
  data: Limits,
});
export const ModeSetEvent = z.object({
  event: z.literal("mode.set"),
  data: z.object({
    mode: DeskMode,
    payload: z.record(z.string(), z.unknown()).default({}),
  }),
});
export const PetStateEvent = z.object({
  event: z.literal("pet.state"),
  data: z.object({
    species: PetSpecies,
    mood: z.string().default("idle"),
    accessory: z.array(z.string()).default([]),
    colors: z.record(z.string(), z.string()).default({}),
  }),
});
export const AppRenderEvent = z.object({
  event: z.literal("app.render"),
  data: z.object({
    appId: z.string(),
    tree: z.array(z.any()).default([]), // RenderNode[] — tipado no firmware/SDK
  }),
});

export const SessionEvent = z.object({
  event: z.literal("session.event"),
  data: z.object({
    sessionId: z.string().uuid(),
    ts: z.number(),
    kind: z.enum(["tool_call", "response", "permission", "error"]),
    payload: z.record(z.string(), z.unknown()).default({}),
  }),
});
export type SessionEvent = z.infer<typeof SessionEvent>;

export const HubToClientEvent = z.discriminatedUnion("event", [
  SessionUpsertEvent,
  SessionRemoveEvent,
  SessionPermissionEvent,
  SessionDoneEvent,
  LimitsUpdateEvent,
  ModeSetEvent,
  PetStateEvent,
  AppRenderEvent,
  SessionEvent,
]);
export type HubToClientEvent = z.infer<typeof HubToClientEvent>;

/* --- Cliente → Hub: requisições RPC tipadas --- */

export const SessionListRequest = z.object({
  id: z.string(),
  method: z.literal("session.list"),
  params: z.object({}),
});
export const SessionPermissionResolveRequest = z.object({
  id: z.string(),
  method: z.literal("session.permission.resolve"),
  params: z.object({
    sessionId: z.string().uuid(),
    reqId: z.string(),
    allow: z.boolean(),
  }),
});
export const SessionReplyRequest = z.object({
  id: z.string(),
  method: z.literal("session.reply"),
  params: z.object({
    sessionId: z.string().uuid(),
    text: z.string(),
  }),
});
export const ModeSetRequest = z.object({
  id: z.string(),
  method: z.literal("mode.set"),
  params: z.object({
    mode: DeskMode,
    seconds: z.number().optional(),
    payload: z.record(z.string(), z.unknown()).default({}),
  }),
});
export const DevicePairConfirmRequest = z.object({
  id: z.string(),
  method: z.literal("device.pair.confirm"),
  params: z.object({
    deviceId: z.string().uuid(),
    code: z.string(),
  }),
});
export const PetConfigureRequest = z.object({
  id: z.string(),
  method: z.literal("pet.configure"),
  params: z.object({
    species: PetSpecies,
    colors: z.record(z.string(), z.string()).default({}),
    accessories: z.array(z.string()).default([]),
  }),
});

export const ClientToHubRequest = z.discriminatedUnion("method", [
  SessionListRequest,
  SessionPermissionResolveRequest,
  SessionReplyRequest,
  ModeSetRequest,
  DevicePairConfirmRequest,
  PetConfigureRequest,
]);
export type ClientToHubRequest = z.infer<typeof ClientToHubRequest>;

/* ========================================================================
   Helpers de validação
   ======================================================================== */

export const validateEnvelope = (unknown: unknown) => WsFrame.safeParse(unknown);

export const validateClientHello = (unknown: unknown) =>
  ClientHello.safeParse(unknown);

export const validateClientRpc = (unknown: unknown) => ClientRpc.safeParse(unknown);

export const validateHubToClient = (unknown: unknown) =>
  HubToClientEvent.safeParse(unknown);

export const validateClientToHub = (unknown: unknown) =>
  ClientToHubRequest.safeParse(unknown);

export const validateJsonRpcError = (unknown: unknown) =>
  JsonRpcError.safeParse(unknown);

/* ========================================================================
   Constantes do protocolo
   ======================================================================== */

export const WS_PORT = 8787;
export const MDNS_SERVICE = "_coding-outside._tcp.local";
export const PAIRING_CODE_TTL_MIN = 10;
export const WS_HEARTBEAT_INTERVAL_MS = 15_000;
export const PROTOCOL_VERSION = 1;
