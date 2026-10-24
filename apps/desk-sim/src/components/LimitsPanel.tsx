import React from "react";
import { Limits } from "@coding-outside/protocol";

interface LimitsBarProps {
  label: string;
  pct: number;
  color: "working" | "idle" | "needs_you";
}

export const LimitsBar: React.FC<LimitsBarProps> = ({ label, pct, color }) => {
  const colorMap = {
    working: "bg-desert-working",
    idle: "bg-desert-idle",
    needs_you: "bg-desert-needs_you",
  };
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-[9px] text-desert-offline/70">
        <span>{label}</span>
        <span>{pct.toFixed(0)}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-desert-surface overflow-hidden border border-desert-surface/50">
        <div
          className={`h-full ${colorMap[color]} transition-all duration-500`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
};

interface LimitsPanelProps {
  limits: Limits;
}

export const LimitsPanel: React.FC<LimitsPanelProps> = ({ limits }) => (
  <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-desert-surface border border-desert-surface/60">
    <div className="text-[9px] font-bold text-desert-idle/80 uppercase tracking-wider">
      limites
    </div>
    <LimitsBar label="5h" pct={limits.fiveHour.pct} color="working" />
    <LimitsBar label="semanal" pct={limits.weekly.pct} color={limits.weekly.pct > 100 ? "needs_you" : "idle"} />
    <div className="text-[8px] text-desert-offline/60 mt-0.5">
      plano: {limits.plan ?? "—"}
    </div>
  </div>
);
