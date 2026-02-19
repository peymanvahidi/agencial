"use client";

import { useState } from "react";
import {
  Crosshair,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Ruler,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChartToolsSidebarProps {
  onToggleCrosshair: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onToggleMeasure: () => void;
  crosshairActive: boolean;
  measureActive: boolean;
}

// ---------------------------------------------------------------------------
// ToolButton - icon-only button with tooltip
// ---------------------------------------------------------------------------

function ToolButton({
  icon: Icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        "flex size-8 items-center justify-center rounded transition-colors",
        active
          ? "bg-brand/20 text-brand"
          : "text-white/50 hover:bg-white/5 hover:text-white/90",
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}

// ---------------------------------------------------------------------------
// ChartToolsSidebar
// ---------------------------------------------------------------------------

export function ChartToolsSidebar({
  onToggleCrosshair,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onToggleMeasure,
  crosshairActive,
  measureActive,
}: ChartToolsSidebarProps) {
  return (
    <div
      className="flex shrink-0 flex-col items-center gap-1 border-r py-2"
      style={{
        width: "40px",
        backgroundColor: "#1e222d",
        borderColor: "#2a2e39",
      }}
    >
      {/* Crosshair toggle */}
      <ToolButton
        icon={Crosshair}
        label="Crosshair"
        active={crosshairActive}
        onClick={onToggleCrosshair}
      />

      {/* Separator */}
      <div
        className="mx-auto my-1 h-px w-5"
        style={{ backgroundColor: "#2a2e39" }}
      />

      {/* Zoom controls */}
      <ToolButton icon={ZoomIn} label="Zoom In" onClick={onZoomIn} />
      <ToolButton icon={ZoomOut} label="Zoom Out" onClick={onZoomOut} />
      <ToolButton icon={Maximize2} label="Reset Zoom" onClick={onResetZoom} />

      {/* Separator */}
      <div
        className="mx-auto my-1 h-px w-5"
        style={{ backgroundColor: "#2a2e39" }}
      />

      {/* Measurement tool */}
      <ToolButton
        icon={Ruler}
        label="Measure"
        active={measureActive}
        onClick={onToggleMeasure}
      />
    </div>
  );
}
