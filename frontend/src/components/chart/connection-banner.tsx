"use client";

import type { ConnectionStatus } from "@/types/market-data";

interface ConnectionBannerProps {
  status: ConnectionStatus;
}

/**
 * Connection status banner overlay for the chart area.
 *
 * Shows a colored banner at the top of the chart when WebSocket
 * is not in "connected" state. No chart dimming -- banner only.
 */
export function ConnectionBanner({ status }: ConnectionBannerProps) {
  if (status === "connected") return null;

  const config: Record<
    Exclude<ConnectionStatus, "connected">,
    { bg: string; text: string }
  > = {
    connecting: {
      bg: "bg-amber-600/90",
      text: "Connecting to market data...",
    },
    reconnecting: {
      bg: "bg-orange-600/90",
      text: "Connection lost -- reconnecting...",
    },
    disconnected: {
      bg: "bg-red-600/90",
      text: "Market data disconnected. Check your connection.",
    },
  };

  const { bg, text } = config[status];

  return (
    <div
      className={`absolute top-0 left-0 right-0 z-30 py-1 text-center text-xs text-white ${bg}`}
    >
      {text}
    </div>
  );
}
