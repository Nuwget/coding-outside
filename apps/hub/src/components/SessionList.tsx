import React from "react";
import { Session } from "@coding-outside/protocol";
import { StatusDot, ToolIcon } from "./ui";

interface SessionCardProps {
  session: Session;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  isSelected,
  onSelect,
}) => {
  return (
    <button
      onClick={() => onSelect(session.id)}
      className={`flex flex-col gap-1.5 p-2 rounded border ${
        isSelected
          ? "border-desert-working bg-desert-working/10 ring-1 ring-desert-working"
          : "border-transparent hover:border-desert-idle/50"
      } transition-colors`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ToolIcon tool={session.tool} size={14} />
          <StatusDot status={session.status} />
        </div>
        {session.pendingPermission && (
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
          ${session.costUsd.toFixed(2)}
        </span>
      </div>
      <div className="text-[9px] text-desert-offline/60 truncate">
        {session.tool} · {session.tokensIn.toLocaleString()} in / {session.tokensOut.toLocaleString()} out
      </div>
    </button>
  );
};

interface SessionListProps {
  sessions: Session[];
  selectedSessionId: string | null;
  onSelect: (id: string) => void;
}

export const SessionList: React.FC<SessionListProps> = ({
  sessions,
  selectedSessionId,
  onSelect,
}) => (
  <div className="flex-1 overflow-y-auto p-2 space-y-1">
    {sessions.length === 0 ? (
      <div className="flex flex-col items-center justify-center h-32 text-desert-offline/60 text-[11px]">
        Nenhuma sessão ativa<br />
        <span className="mt-1 text-[9px]">Use "Simular sessão" para testar</span>
      </div>
    ) : (
      sessions.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
          isSelected={selectedSessionId === session.id}
          onSelect={onSelect}
        />
      ))
    )}
  </div>
);
