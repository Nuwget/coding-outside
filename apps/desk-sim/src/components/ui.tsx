import React from "react";
import { SessionStatus, Tool } from "@coding-outside/protocol";
import { TOOL_ICONS, TOOL_COLORS } from "../store";

interface StatusDotProps {
  status: SessionStatus;
}

export const StatusDot: React.FC<StatusDotProps> = ({ status }) => {
  const color = {
    idle: "bg-desert-idle",
    working: "bg-desert-working",
    needs_you: "bg-desert-needs_you",
    done: "bg-desert-done",
    error: "bg-desert-error",
    offline: "bg-desert-offline",
  }[status];
  return (
    <div className={`w-2 h-2 rounded-full ${color} shadow-[0_0_8px_currentColor]`} />
  );
};

interface ToolIconProps {
  tool: Tool;
  size?: number;
}

export const ToolIcon: React.FC<ToolIconProps> = ({ tool, size = 16 }) => {
  const color = TOOL_COLORS[tool];
  return (
    <span
      className="text-xs select-none"
      style={{ color }}
      title={tool}
    >
      {TOOL_ICONS[tool]}
    </span>
  );
};
