import React, { useEffect, useCallback } from "react";
import { useHubStore } from "./store";
import { Sidebar } from "./components/Sidebar";
import { SessionList } from "./components/SessionList";
import { SessionDetail } from "./components/SessionDetail";
import { LimitsPanel } from "./components/LimitsPanel";

export default function App() {
  const {
    sessions,
    selectedSessionId,
    wsConnected,
    hubInfo,
    setSessions,
    selectSession,
    setWsConnected,
    setHubInfo,
    addSession,
  } = useHubStore();

  const selectedSession = sessions.find((s) => s.id === selectedSessionId);

  // Conecta no WebSocket do Hub (porta 8787, mesmo host)
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.hostname}:8787`;
    let ws: WebSocket | null = null;

    const connect = () => {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        setWsConnected(true);
        // Envia device.hello conforme protocolo v1
        ws!.send(JSON.stringify({
          v: 1,
          type: "hello",
          deviceId: "hub-desktop",
          clientKind: "desk",
          protocolV: 1,
          capabilities: { screenW: 1280, screenH: 800, pets: true, apps: true, touch: false },
        }));
        // Solicita lista de sessões
        ws!.send(JSON.stringify({
          v: 1,
          type: "rpc",
          id: "rpc-1",
          method: "session.list",
          params: {},
        }));
      };
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "rpc.response" && msg.method === "session.list") {
            setSessions(msg.sessions ?? []);
          } else if (msg.type === "event" && msg.event === "session.upsert") {
            addSession(msg.data);
          } else if (msg.type === "event" && msg.event === "session.remove") {
            setSessions(sessions.filter((s) => s.id !== msg.data.id));
          } else if (msg.type === "hello.ack") {
            setHubInfo({
              hubId: msg.hubId,
              wsPort: msg.wsPort,
              protocolVersion: msg.protocolVersion ?? 1,
            });
          }
        } catch (e) {
          console.error("Erro ao processar mensagem WS:", e);
        }
      };
      ws.onclose = () => {
        setWsConnected(false);
        setTimeout(connect, 2000);
      };
      ws.onerror = () => {
        setWsConnected(false);
      };
    };

    connect();
    return () => ws?.close();
  }, [setWsConnected, setSessions, addSession, setHubInfo]);

  const handleSelect = useCallback((id: string) => {
    selectSession(id);
  }, [selectSession]);

  return (
    <div className="flex h-screen w-screen bg-desert-bg selection:bg-desert-working selection:text-desert-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-8 border-b border-desert-surface/40 bg-desert-bg/80 backdrop-blur px-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? "bg-desert-idle" : "bg-desert-offline"} animate-pulse`} />
            <span className="text-[10px] font-bold text-desert-idle tracking-widest uppercase">
              coding outside hub
            </span>
          </div>
          <div className="text-[9px] text-desert-offline/70 font-mono">
            ws:{hubInfo?.wsPort ?? 8787} · v{hubInfo?.protocolVersion ?? 1}
          </div>
        </header>
        <div className="flex-1 overflow-hidden flex">
          <div className="w-3/5 border-r border-desert-surface/40 overflow-y-auto p-2">
            <SessionList
              sessions={sessions}
              selectedSessionId={selectedSessionId}
              onSelect={handleSelect}
            />
          </div>
          <div className="w-2/5 border-l border-desert-surface/40 bg-desert-bg/50 overflow-y-auto p-3">
            <SessionDetail session={selectedSession ?? null} />
            {selectedSession && (
              <div className="mt-3">
                <LimitsPanel limits={null} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
