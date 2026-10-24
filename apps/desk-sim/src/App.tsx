import React, { useCallback } from "react";
import { useDeskStore } from "./store";
import { SessionGrid } from "./components/SessionGrid";
import { PermissionCard } from "./components/PermissionCard";
import { Pet } from "./components/Pet";
import { ModeSwitcher } from "./components/ModeSwitcher";
import { StatusDot } from "./components/ui";

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function App() {
  const {
    mode,
    sessions,
    selectedSessionId,
    pendingPermission,
    selectSession,
    resolvePermission,
    togglePermissionSim,
  } = useDeskStore();

  const selectedSession = sessions.find((s) => s.id === selectedSessionId);
  const pending = pendingPermission ?? selectedSession?.pendingPermission;

  const handleResolve = useCallback(
    (allow: boolean) => {
      resolvePermission(allow);
    },
    [resolvePermission]
  );

  const activeSessions = sessions.length;
  const workingSessions = sessions.filter((s) => s.status === "working").length;
  const needsYou = sessions.filter((s) => s.status === "needs_you").length;

  const aggregateStatus = (() => {
    if (needsYou > 0) return "needs_you";
    if (workingSessions > 0) return "working";
    if (activeSessions > 0) return "idle";
    return "offline";
  })();

  const statusColor = {
    idle: "text-desert-idle",
    working: "text-desert-working",
    needs_you: "text-desert-needs_you",
    done: "text-desert-done",
    error: "text-desert-error",
    offline: "text-desert-offline",
  }[aggregateStatus];

  const renderMode = () => {
    switch (mode) {
      case "sessions":
        return (
          <div className="p-2">
            <SessionGrid
              sessions={sessions}
              selectedSessionId={selectedSessionId ?? null}
              onSelect={selectSession}
              onSimPermission={togglePermissionSim}
            />
          </div>
        );
      case "focus":
        return (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <div className="text-6xl font-bold text-desert-working">25:00</div>
            <div className="text-[10px] text-desert-idle/80 uppercase tracking-wider">
              modo foco
            </div>
            <div className="text-[9px] text-desert-offline/60">
              sem interrupções por 25 min
            </div>
          </div>
        );
      case "meeting":
        return (
          <div className="flex flex-col items-center justify-center h-full gap-2 p-4">
            <div className="text-4xl font-bold text-desert-idle">22:14</div>
            <div className="flex items-center gap-1.5">
              <StatusDot status="idle" />
              <span className="text-[10px] text-desert-idle/80 uppercase">
                modo reunião — sensível oculto
              </span>
            </div>
          </div>
        );
      case "message":
        return (
          <div className="flex items-center justify-center h-full p-4">
            <div className="rounded-lg border border-desert-working/40 bg-desert-surface p-3 max-w-[220px]">
              <div className="text-[10px] text-desert-working/70 mb-1 uppercase tracking-wider">
                recado
              </div>
              <div className="text-[11px] text-desert-idle leading-relaxed">
                "Sua Bubu te ama. Volte quando puder." 💜
              </div>
              <div className="mt-2 text-[8px] text-desert-offline/60">
                {formatTime(Date.now())}
              </div>
            </div>
          </div>
        );
      case "timer":
        return (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <div className="text-6xl font-bold text-desert-idle">05:00</div>
            <div className="text-[9px] text-desert-offline/60">ampulheta</div>
          </div>
        );
      case "countdown":
        return (
          <div className="flex flex-col items-center justify-center h-full gap-2 p-4">
            <div className="text-4xl font-bold text-desert-working">3d 14h</div>
            <div className="text-[10px] text-desert-idle/80 uppercase tracking-wider">
              lançamento
            </div>
            <div className="text-[8px] text-desert-offline/50">confete no dia</div>
          </div>
        );
      case "pet":
        return <Pet species="capybara" />;
      case "app":
        return (
          <div className="flex items-center justify-center h-full p-2">
            <div className="rounded-lg border border-desert-surface/60 bg-desert-surface p-2 w-[280px] h-[200px]">
              <div className="text-[9px] text-desert-offline/60 mb-1 uppercase tracking-wider">
                desk app render
              </div>
              <div className="text-[10px] text-desert-idle/50 text-center h-full flex items-center justify-center">
                aguardando tree do Hub…
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-desert-bg selection:bg-desert-working selection:text-desert-bg">
      {/* Header */}
      <header className="h-8 flex items-center justify-between px-2 border-b border-desert-surface/40 bg-desert-bg/80 backdrop-blur z-10">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-desert-working shadow-[0_0_6px_rgba(255,217,61,0.6)]" />
          <span className="text-[10px] font-bold text-desert-idle tracking-widest uppercase">
            coding outside
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-desert-offline/70">
          <span>{activeSessions}</span>
          <span className={`w-1 h-1 rounded-full ${statusColor}`} />
          <span>{formatTime(Date.now())}</span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 flex items-center justify-center">
          {renderMode()}
        </div>

        {/* Permission overlay */}
        {pending && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-desert-bg/90 backdrop-blur-sm p-2">
            <PermissionCard
              sessionId={selectedSessionId ?? ""}
              permission={pending}
              onResolve={handleResolve}
            />
          </div>
        )}

        {/* Simular permissão (floating, apenas em sessions) */}
        {mode === "sessions" && !pending && (
          <button
            onClick={togglePermissionSim}
            className="absolute bottom-2 right-2 z-10 h-7 px-2 rounded border border-desert-needs_you/30 bg-desert-needs_you/10 text-[9px] text-desert-needs_you hover:bg-desert-needs_you/30 transition flex items-center gap-1"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-desert-needs_you animate-pulse" />
            simular permissão
          </button>
        )}
      </main>

      {/* Footer */}
      <footer className="h-10 border-t border-desert-surface/40 bg-desert-bg/80 backdrop-blur flex items-center justify-between px-2 z-10">
        <ModeSwitcher />
        <div className="text-[8px] text-desert-offline/50 font-mono">
          dev · desk-sim
        </div>
      </footer>
    </div>
  );
}
