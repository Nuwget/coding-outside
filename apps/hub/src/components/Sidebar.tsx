import React from "react";
import { useHubStore } from "../store";
import { PairingPanel } from "./PairingPanel";

export const Sidebar: React.FC = () => {
  const { sessions, wsConnected } = useHubStore();

  const workingCount = sessions.filter((s) => s.status === "working").length;
  const needsYouCount = sessions.filter((s) => s.status === "needs_you").length;

  return (
    <aside className="w-64 border-r border-desert-surface/40 bg-desert-bg/90 backdrop-blur flex flex-col z-20">
      <div className="p-3 border-b border-desert-surface/40">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-desert-working shadow-[0_0_6px_rgba(255,217,61,0.6)]" />
          <span className="text-xs font-bold text-desert-idle tracking-widest uppercase">
            coding outside
          </span>
        </div>
        <div className="text-[9px] text-desert-offline/60 mt-0.5 font-mono">
          hub
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-0.5">
        <button
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-[10px] font-bold text-desert-idle bg-desert-surface/30"
        >
          <span className="w-1 h-3 rounded-full bg-desert-idle mr-1.5" />
          sessões
        </button>
        <button
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-[10px] font-bold text-desert-offline/60 hover:text-desert-idle hover:bg-desert-surface/30 transition"
        >
          limites
        </button>
        <button
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-[10px] font-bold text-desert-offline/60 hover:text-desert-idle hover:bg-desert-surface/30 transition"
        >
          pets
        </button>
        <button
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-[10px] font-bold text-desert-offline/60 hover:text-desert-idle hover:bg-desert-surface/30 transition"
        >
          desk apps
        </button>
        <button
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-[10px] font-bold text-desert-offline/60 hover:text-desert-idle hover:bg-desert-surface/30 transition"
        >
          pareamento
        </button>
        <button
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-[10px] font-bold text-desert-offline/60 hover:text-desert-idle hover:bg-desert-surface/30 transition"
        >
          ajustes
        </button>
      </nav>

      <div className="p-2 border-t border-desert-surface/40">
        <PairingPanel />
      </div>

      <div className="mt-auto p-2">
        <div className="flex items-center gap-2 text-[9px] text-desert-offline/70">
          <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? "bg-desert-idle" : "bg-desert-offline"}`} />
          <span>{wsConnected ? "online" : "offline"}</span>
        </div>
        <div className="flex gap-1 mt-1 text-[9px]">
          <span className={`w-1 h-1 rounded-full ${workingCount > 0 ? "bg-desert-working" : "bg-desert-offline"}`} />
          <span className={workingCount > 0 ? "text-desert-working" : "text-desert-offline/60"}>
            {workingCount} trabalhando
          </span>
          <span className={`w-1 h-1 rounded-full ${needsYouCount > 0 ? "bg-desert-needs_you" : "bg-desert-offline"}`} />
          <span className={needsYouCount > 0 ? "text-desert-needs_you" : "text-desert-offline/60"}>
            {needsYouCount} precisa de você
          </span>
        </div>
      </div>
    </aside>
  );
};
