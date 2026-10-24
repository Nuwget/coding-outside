import React from "react";
import { useHubStore } from "../store";

export const PairingPanel: React.FC = () => {
  const { pairingCode, setPairingCode } = useHubStore();

  return (
    <div className="flex flex-col gap-2 p-2 rounded-lg bg-desert-surface border border-desert-working/50">
      <div className="text-[9px] font-bold text-desert-working uppercase tracking-wider mb-1">
        parear dispositivo (iphone/remote)
      </div>
      {pairingCode ? (
        <>
          <div className="text-3xl font-mono font-bold text-desert-working tracking-widest text-center">
            {pairingCode.match(/.{1,2}/g)?.join(" ") ?? pairingCode}
          </div>
          <div className="text-[9px] text-desert-offline/60 text-center">
            código válido por 10 min · insira no app Remote do iPhone
          </div>
          <button
            onClick={() => setPairingCode(null)}
            className="w-full py-1 rounded border border-desert-surface/60 text-[9px] text-desert-offline hover:bg-desert-surface/40 transition"
          >
            gerar novo código
          </button>
        </>
      ) : (
        <button
          onClick={async () => {
            try {
              const res = await window.__TAURI__.invoke("generate_pairing_code", {
                deviceId: "remote-iphone",
                clientKind: "remote",
                capabilities: JSON.stringify({ screenW: 390, screenH: 844, pets: false, apps: false, touch: true }),
              });
              const data = JSON.parse(res as string);
              setPairingCode(data.code);
            } catch (e) {
              console.error("Erro ao gerar código:", e);
            }
          }}
          className="w-full py-2 rounded bg-desert-working/10 border border-desert-working/40 text-desert-working text-xs font-bold hover:bg-desert-working/30 transition flex items-center justify-center gap-1.5"
        >
          📱 gerar código de pareamento
        </button>
      )}
    </div>
  );
};
