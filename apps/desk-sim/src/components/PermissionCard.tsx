import React from "react";
import { Permission } from "@coding-outside/protocol";
import { useDeskStore } from "../store";

interface PermissionCardProps {
  sessionId: string;
  permission: Permission;
  onResolve: (allow: boolean) => void;
}

export const PermissionCard: React.FC<PermissionCardProps> = ({
  permission,
  onResolve,
}) => {
  const riskColor = {
    low: "bg-desert-idle/20 border-desert-idle/40 text-desert-idle",
    medium: "bg-desert-working/20 border-desert-working/40 text-desert-working",
    high: "bg-desert-needs_you/20 border-desert-needs_you/40 text-desert-needs_you",
  }[permission.risk];

  return (
    <div className="flex flex-col gap-2 p-2 rounded-lg bg-desert-surface border border-desert-working/50 shadow-[0_0_20px_rgba(255,217,61,0.25)]">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-desert-working uppercase tracking-wider">
          permissão de execução
        </span>
        <span
          className={`text-[9px] px-1 py-0.5 rounded border ${riskColor}`}
        >
          {permission.risk}
        </span>
      </div>
      <div className="text-[9px] text-desert-idle/80 font-mono break-all">
        {permission.command}
      </div>
      <div className="flex items-center justify-between text-[8px] text-desert-offline/60">
        <span>{permission.tool}</span>
        <span>{permission.cwd.split("/").slice(-2).join("/")}</span>
      </div>
      <div className="flex gap-1">
        <button
          onClick={() => onResolve(false)}
          className="flex-1 py-1.5 rounded bg-desert-needs_you/20 border border-desert-needs_you/40 text-desert-needs_you text-xs font-bold hover:bg-desert-needs_you/40 transition"
        >
          negar
        </button>
        <button
          onClick={() => onResolve(true)}
          className="flex-1 py-1.5 rounded bg-desert-idle/20 border border-desert-idle/40 text-desert-idle text-xs font-bold hover:bg-desert-idle/40 transition"
        >
          aprovar
        </button>
      </div>
    </div>
  );
>;
