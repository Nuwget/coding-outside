import { create } from "zustand";
import {
  Session,
  SessionStatus,
  Tool,
  Limits,
  DeskMode,
  Permission,
} from "@coding-outside/protocol";

const TOOL_ICONS: Record<Tool, string> = {
  "claude-code": "🤖",
  codex: "⚡",
  "gemini-cli": "✨",
  "copilot-cli": "🪁",
  opencode: "🌀",
  "cursor-agent": "🧭",
};

const TOOL_COLORS: Record<Tool, string> = {
  "claude-code": "#66fcb1",
  codex: "#ffd93d",
  "gemini-cli": "#bb86fc",
  "copilot-cli": "#03dac6",
  opencode: "#ff6b6b",
  "cursor-agent": "#45aaf2",
};

export const MOCK_SESSIONS: Session[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    tool: "claude-code",
    status: "working",
    cwd: "/home/nuwget/projects/loja",
    label: "loja · auth fix",
    startedAt: Date.now() - 600_000,
    lastEventAt: Date.now() - 30_000,
    tokensIn: 12_450,
    tokensOut: 3_210,
    costUsd: 0.42,
    currentAction: "Edit src/auth.ts",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    tool: "codex",
    status: "needs_you",
    cwd: "/home/nuwget/projects/budu-crush",
    label: "budu-crush · v2 sprites",
    startedAt: Date.now() - 900_000,
    lastEventAt: Date.now() - 120_000,
    tokensIn: 45_100,
    tokensOut: 12_050,
    costUsd: 1.15,
    currentAction: "Edit public/sprites/dudu.webp",
    pendingPermission: {
      reqId: "perm-001",
      command: "npm install sharp@0.33.5",
      tool: "Bash",
      cwd: "/home/nuwget/projects/budu-crush",
      expiresAt: Date.now() + 300_000,
      risk: "medium",
    },
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    tool: "opencode",
    status: "idle",
    cwd: "/home/nuwget/Documents/projects/coding-outside",
    label: "coding-outside · AGENTS.md",
    startedAt: Date.now() - 1_800_000,
    lastEventAt: Date.now() - 900_000,
    tokensIn: 8_900,
    tokensOut: 2_100,
    costUsd: 0.18,
    currentAction: undefined,
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    tool: "gemini-cli",
    status: "done",
    cwd: "/home/nuwget/projects/open-part",
    label: "open-part · parser",
    startedAt: Date.now() - 3_600_000,
    lastEventAt: Date.now() - 300_000,
    tokensIn: 33_200,
    tokensOut: 9_800,
    costUsd: 0.87,
    currentAction: undefined,
  },
  {
    id: "55555555-5555-5555-5555-555555555555",
    tool: "cursor-agent",
    status: "error",
    cwd: "/home/nuwget/projects/welcome-to-your-past",
    label: "welcome-to-your-past · deploy",
    startedAt: Date.now() - 720_000,
    lastEventAt: Date.now() - 60_000,
    tokensIn: 11_500,
    tokensOut: 3_400,
    costUsd: 0.31,
    currentAction: "gh repo create",
  },
];

export const MOCK_LIMITS: Limits = {
  fiveHour: { pct: 68, resetAt: Date.now() + 3_600_000 },
  weekly: { pct: 412, resetAt: Date.now() + 3_600_000 * 168 },
  plan: "max",
};

type ModePayload = Record<string, unknown>;

interface DeskState {
  mode: DeskMode;
  sessions: Session[];
  selectedSessionId: string | null;
  limits: Limits;
  pendingPermission: Permission | null;
  setMode: (mode: DeskMode, payload?: ModePayload) => void;
  selectSession: (id: string | null) => void;
  resolvePermission: (allow: boolean) => void;
  togglePermissionSim: () => void;
}

export const useDeskStore = create<DeskState>((set) => ({
  mode: "sessions",
  sessions: MOCK_SESSIONS,
  selectedSessionId: null,
  limits: MOCK_LIMITS,
  pendingPermission: null,

  setMode: (mode, payload) => {
    set({ mode });
    console.log("[desk-sim] mode.set", mode, payload);
  },

  selectSession: (id) => set({ selectedSessionId: id }),

  resolvePermission: (allow) =>
    set((state) => ({
      pendingPermission: null,
      sessions: state.sessions.map((s) =>
        s.pendingPermission && allow
          ? { ...s, status: "working" as SessionStatus, pendingPermission: undefined }
          : s.pendingPermission && !allow
            ? { ...s, status: "idle" as SessionStatus, pendingPermission: undefined }
            : s
      ),
    })),

  togglePermissionSim: () =>
    set((state) => ({
      pendingPermission: state.pendingPermission
        ? null
        : {
            reqId: "perm-sim",
            command: "git push origin main --force",
            tool: "Bash",
            cwd: "/home/nuwget/Documents/projects/coding-outside",
            expiresAt: Date.now() + 300_000,
            risk: "high",
          },
    })),
}));

export { TOOL_ICONS, TOOL_COLORS };
