import { create } from "zustand";
import {
  Session,
  Tool,
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

interface HubState {
  sessions: Session[];
  selectedSessionId: string | null;
  wsConnected: boolean;
  hubInfo: { hubId: string; wsPort: number; protocolVersion: number } | null;
  pairingCode: string | null;
  setSessions: (sessions: Session[]) => void;
  selectSession: (id: string | null) => void;
  setWsConnected: (connected: boolean) => void;
  setHubInfo: (info: { hubId: string; wsPort: number; protocolVersion: number } | null) => void;
  setPairingCode: (code: string | null) => void;
  addSession: (session: Session) => void;
  updateSession: (id: string, partial: Partial<Session>) => void;
}

export const useHubStore = create<HubState>((set) => ({
  sessions: [],
  selectedSessionId: null,
  wsConnected: false,
  hubInfo: null,
  pairingCode: null,

  setSessions: (sessions) => set({ sessions }),
  selectSession: (id) => set({ selectedSessionId: id }),
  setWsConnected: (connected) => set({ wsConnected: connected }),
  setHubInfo: (info) => set({ hubInfo: info }),
  setPairingCode: (code) => set({ pairingCode: code }),
  addSession: (session) =>
    set((state) => ({ sessions: [...state.sessions, session] })),
  updateSession: (id, partial) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, ...partial } : s
      ),
    })),
}));

export { TOOL_ICONS, TOOL_COLORS };
