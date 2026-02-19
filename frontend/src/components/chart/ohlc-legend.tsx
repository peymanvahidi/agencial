"use client";

import type { ChartType } from "@/types/chart";

interface OHLCLegendProps {
  symbol: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  chartType: ChartType;
}

/**
 * Format price with appropriate decimal places.
 * Sub-dollar prices get 4 decimals, others get 2.
 */
function formatPrice(value: number): string {
  if (Math.abs(value) < 1) {
    return value.toFixed(4);
  }
  return value.toFixed(2);
}

/**
 * OHLC legend overlay positioned at the top-left of the chart container.
 * Shows symbol name, O/H/L/C values colored by candle direction (green bullish, red bearish).
 */
export function OHLCLegend({
  symbol,
  open,
  high,
  low,
  close,
  chartType,
}: OHLCLegendProps) {
  const hasData = open !== null && close !== null;
  const isBullish = hasData ? close! >= open! : true;
  const valueColor = isBullish ? "#26a69a" : "#ef5350";

  // Chart type display labels
  const chartTypeLabel: Record<ChartType, string> = {
    candlestick: "",
    "heikin-ashi": "HA",
    ohlc: "OHLC",
    line: "Line",
    area: "Area",
  };

  const typeLabel = chartTypeLabel[chartType];

  return (
    <div
      className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-3 rounded px-2.5 py-1.5"
      style={{
        backgroundColor: "#131722cc",
        fontFamily: "monospace",
        fontSize: "12px",
      }}
    >
      {/* Symbol name */}
      <span className="font-bold text-white">
        {symbol}
        {typeLabel && (
          <span className="ml-1.5 font-normal text-white/50">{typeLabel}</span>
        )}
      </span>

      {hasData && (
        <>
          <span className="text-white/50">
            O{" "}
            <span style={{ color: valueColor }}>{formatPrice(open!)}</span>
          </span>
          <span className="text-white/50">
            H{" "}
            <span style={{ color: valueColor }}>{formatPrice(high!)}</span>
          </span>
          <span className="text-white/50">
            L{" "}
            <span style={{ color: valueColor }}>{formatPrice(low!)}</span>
          </span>
          <span className="text-white/50">
            C{" "}
            <span style={{ color: valueColor }}>{formatPrice(close!)}</span>
          </span>
        </>
      )}
    </div>
  );
}
