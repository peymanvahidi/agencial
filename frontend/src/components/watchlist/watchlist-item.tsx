"use client";

import { useMemo } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getMockDataForSymbol } from "@/lib/mock-data";
import { useMarketDataStore } from "@/stores/market-data-store";

interface WatchlistItemProps {
  symbol: string;
  isActive: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

/**
 * Format a raw symbol string for display.
 * Crypto: "BTCUSDT" -> "BTC/USDT"
 * Forex: "EUR/USD" -> "EUR/USD" (already formatted with slash)
 */
function formatSymbol(symbol: string): string {
  // Forex symbols already contain "/" -- return as-is
  if (symbol.includes("/")) return symbol;
  // Crypto symbols ending in USDT
  if (symbol.endsWith("USDT")) {
    return `${symbol.slice(0, -4)}/USDT`;
  }
  return symbol;
}

/**
 * Format a price with appropriate decimal places based on magnitude.
 */
function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(2);
  if (price >= 0.01) return price.toFixed(4);
  return price.toFixed(6);
}

export function WatchlistItem({
  symbol,
  isActive,
  onSelect,
  onRemove,
}: WatchlistItemProps) {
  // Try live price from WebSocket stream first
  const liveCandle = useMarketDataStore((s) => s.latestPrices.get(symbol));

  // Compute price data: prefer live, fallback to mock
  const { lastPrice, changePercent } = useMemo(() => {
    if (liveCandle) {
      // Use intra-candle change (close vs open) -- best available from a single candle
      const change =
        liveCandle.open > 0
          ? ((liveCandle.close - liveCandle.open) / liveCandle.open) * 100
          : 0;
      return { lastPrice: liveCandle.close, changePercent: change };
    }

    // Fallback to mock data
    const data = getMockDataForSymbol(symbol, "1D");
    if (data.length === 0) return { lastPrice: 0, changePercent: 0 };

    const lastCandle = data[data.length - 1];
    const compareIndex = Math.max(0, data.length - 2);
    const compareCandle = data[compareIndex];

    const last = lastCandle.close;
    const change = compareCandle.close > 0
      ? ((last - compareCandle.close) / compareCandle.close) * 100
      : 0;

    return { lastPrice: last, changePercent: change };
  }, [symbol, liveCandle]);

  const isPositive = changePercent >= 0;

  return (
    <div
      className={cn(
        "group relative flex cursor-pointer items-center justify-between px-3 py-1.5 text-xs transition-colors",
        isActive
          ? "bg-brand/10 text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent",
      )}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {/* Left: Symbol name */}
      <span className="font-medium">{formatSymbol(symbol)}</span>

      {/* Right: Price and change */}
      <div className="flex items-center gap-2">
        <span className="tabular-nums text-sidebar-foreground/80">
          {formatPrice(lastPrice)}
        </span>
        <span
          className={cn(
            "min-w-[3.5rem] text-right tabular-nums",
            isPositive ? "text-green-400" : "text-red-400",
          )}
        >
          {isPositive ? "+" : ""}
          {changePercent.toFixed(2)}%
        </span>

        {/* Remove button (visible on hover) */}
        <button
          className="ml-1 hidden rounded p-0.5 text-muted-foreground transition-colors hover:bg-destructive/20 hover:text-destructive group-hover:block"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          title={`Remove ${formatSymbol(symbol)}`}
          aria-label={`Remove ${formatSymbol(symbol)} from watchlist`}
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
