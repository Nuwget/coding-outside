import React from "react";
import { Session } from "@coding-outside/protocol";
import { StatusDot, ToolIcon } from "./ui";

interface SessionCardProps {
  session: Session;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onSimPermission: () => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  isSelected,
  onSelect,
  onSimPermission,
}) => {
  const needsYou = session.status === "needs_you";
  const hasPending = !!session.pendingPermission;

  return (
    <button
      onClick={() => onSelect(session.id)}
      className={`flex flex-col gap-1.5 p-1.5 rounded bg-desert-surface border ${
        isSelected
          ? "border-desert-working ring-1 ring-desert-working shadow-[0_0_10px_rgba(255,217,61,0.35)]"
          : "border-transparent hover:border-desert-idle/50"
        } transition-colors`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ToolIcon tool={session.tool} size={14} />
          <StatusDot status={session.status} />
        </div>
        {hasPending && (
          <span className="w-1.5 h-1.5 rounded-full bg-desert-needs_you animate-pulse" />
        )}
      </div>
      <div className="text-[10px] leading-none text-desert-idle/80 truncate">
        {session.label}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-desert-offline/70 truncate">
          {session.currentAction ?? session.cwd.split("/").slice(-2).join("/")}
        </span>
        <span className="text-[9px] font-bold text-desert-working">
          {session.costUsd.toFixed(2)}
        </span>
      </div>
      {needsYou && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSimPermission();
          }}
          className="mt-1 h-5 px-1.5 rounded bg-desert-needs_you/10 border border-desert-needs_you/30 text-[8px] text-desert-needs_you hover:bg-desert-needs_you/20 transition"
        >
          aprovar
        </button>
      )}
    </button>
  );
};

interface SessionGridProps {
  sessions: Session[];
  selectedSessionId: string | null;
  onSelect: (id: string) => void;
  onSimPermission: () => void;
}

export const SessionGrid: React.FC<SessionGridProps> = ({
  sessions,
  selectedSessionId,
  onSelect,
  onSimPermission,
}) => (
  <div className="grid grid-cols-4 gap-1.5 p-1.5">
    {sessions.map((session) => (
      <SessionCard
        key={session.id}
        session={session}
        isSelected={selectedSessionId === session.id}
        onSelect={onSelect}
        onSimPermission={onSimPermission}
      />
    ))}
  </div>
);
