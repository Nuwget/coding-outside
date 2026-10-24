import React from "react";
import { Session, SessionStatus } from "@coding-outside/protocol";

interface SessionDetailProps {
  session: Session | null;
}

export const SessionDetail: React.FC<SessionDetailProps> = ({ session }) => {
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-desert-offline/60 text-[11px]">
        Selecione uma sessão
      </div>
    );
  }

  const pending = session.pendingPermission;

  return (
    <div className="flex flex-col h-full gap-2 p-3">
      <div className="border-b border-desert-surface/40 pb-2 mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold text-desert-idle tracking-wider uppercase">
            sessão
          </span>
          <StatusDotInline status={session.status} />
        </div>
        <div className="text-[12px] font-bold text-desert-idle truncate">
          {session.label}
        </div>
        <div className="text-[9px] text-desert-offline/70 font-mono truncate">
          {session.cwd}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="flex flex-col gap-0.5">
          <span className="text-desert-offline/60">tokens in</span>
          <span className="text-desert-idle font-mono">{session.tokensIn.toLocaleString()}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-desert-offline/60">tokens out</span>
          <span className="text-desert-idle font-mono">{session.tokensOut.toLocaleString()}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-desert-offline/60">custo</span>
          <span className="text-desert-working font-mono">${session.costUsd.toFixed(4)}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-desert-offline/60">rev</span>
          <span className="text-desert-idle font-mono">{session.rev}</span>
        </div>
      </div>

      {session.currentAction && (
        <div className="mt-2">
          <span className="text-[9px] text-desert-offline/60 block mb-0.5">ação atual</span>
          <div className="bg-desert-surface/40 rounded p-1.5 text-[10px] font-mono text-desert-idle break-all border border-desert-surface/60">
            {session.currentAction}
          </div>
        </div>
      )}

      {pending && (
        <div className="mt-3 rounded-lg border border-desert-needs_you/40 bg-desert-needs_you/10 p-2">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-desert-needs_you animate-pulse" />
            <span className="text-[10px] font-bold text-desert-needs_you uppercase">requer sua atenção</span>
          </div>
          <div className="text-[9px] font-mono text-desert-idle mb-2 break-all">
            {pending.command}
          </div>
          <div className="text-[9px] text-desert-offline/70 mb-2">
            {pending.tool} · {pending.cwd.split("/").slice(-2).join("/")} · risco: {pending.risk}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => {
                window.__TAURI__.invoke("resolve_permission", {
                  sessionId: session.id,
                  reqId: pending.reqId,
                  allow: false,
                });
              }}
              className="flex-1 py-1.5 rounded bg-desert-needs_you/20 border border-desert-needs_you/40 text-desert-needs_you text-xs font-bold hover:bg-desert-needs_you/40 transition"
            >
              negar
            </button>
            <button
              onClick={() => {
                window.__TAURI__.invoke("resolve_permission", {
                  sessionId: session.id,
                  reqId: pending.reqId,
                  allow: true,
                });
              }}
              className="flex-1 py-1.5 rounded bg-desert-idle/20 border border-desert-idle/40 text-desert-idle text-xs font-bold hover:bg-desert-idle/40 transition"
            >
              aprovar
            </button>
          </div>
        </div>
      )}

      {!pending && session.status === "idle" && (
        <div className="mt-3 text-[10px] text-desert-offline/60 text-center">
          sem ação pendente
        </div>
      )}
    </div>
  );
};

function StatusDotInline({ status }: { status: SessionStatus }) {
  const colorMap: Record<SessionStatus, string> = {
    idle: "bg-desert-idle",
    working: "bg-desert-working",
    needs_you: "bg-desert-needs_you",
    done: "bg-desert-done",
    error: "bg-desert-error",
    offline: "bg-desert-offline",
  };
  return <div className={`w-2 h-2 rounded-full ${colorMap[status]}`} />;
}
