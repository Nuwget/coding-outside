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
   WebSocket — JSON-RPC 2.0 sobre WS
   ======================================================================== */

/* --- Hub → Desk/Remote (eventos, sem "id") --- */

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

export const HubToClientEvent = z.discriminatedUnion("event", [
  SessionUpsertEvent,
  SessionRemoveEvent,
  SessionPermissionEvent,
  SessionDoneEvent,
  LimitsUpdateEvent,
  ModeSetEvent,
  PetStateEvent,
  AppRenderEvent,
]);
export type HubToClientEvent = z.infer<typeof HubToClientEvent>;

/* --- Cliente → Hub (RPC, com "id") --- */

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

/* --- Erro JSON-RPC --- */

export const JsonRpcError = z.object({
  id: z.string().optional(),
  error: z.object({
    code: z.number(),
    message: z.string(),
    data: z.unknown().optional(),
  }),
});
export type JsonRpcError = z.infer<typeof JsonRpcError>;

/* --- Envelope completo de um frame WS --- */

export const WsFrame = z.discriminatedUnion("event", [
  ...HubToClientEvent.options,
] as any);
/* Nota: requests de cliente possuem "method" (não "event"); validar
   separadamente com ClientToHubRequest quando houver "method". */
export type WsFrame = z.infer<typeof WsFrame>;

/* ========================================================================
   Helpers de validação
   ======================================================================== */

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
