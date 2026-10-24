import React from "react";
import { DeskMode } from "@coding-outside/protocol";
import { useDeskStore } from "../store";

const MODE_LABELS: Record<DeskMode, string> = {
  sessions: "sessões",
  focus: "foco",
  meeting: "reunião",
  message: "recado",
  timer: "timer",
  countdown: "contagem",
  pet: "pet",
  app: "app",
};

export const ModeSwitcher: React.FC = () => {
  const { mode, setMode } = useDeskStore();
  const modes: DeskMode[] = [
    "sessions",
    "focus",
    "meeting",
    "message",
    "timer",
    "countdown",
    "pet",
    "app",
  ];

  return (
    <div className="flex gap-0.5 p-1 bg-desert-surface rounded-lg border border-desert-surface/60">
      {modes.map((m) => (
        <button
          key={m}
          onClick={() => setMode(m)}
          className={`flex-1 py-1 rounded text-[9px] font-bold transition ${
            mode === m
              ? "bg-desert-working text-desert-bg shadow-[0_0_8px_rgba(255,217,61,0.4)]"
              : "text-desert-idle/60 hover:text-desert-idle"
          }`}
        >
          {MODE_LABELS[m]}
        </button>
      ))}
    </div>
  );
};
