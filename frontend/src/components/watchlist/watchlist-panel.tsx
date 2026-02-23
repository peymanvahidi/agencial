"use client";

import { useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { Loader2 } from "lucide-react";
import { useWatchlistStore } from "@/stores/watchlist-store";
import { useChartStore } from "@/stores/chart-store";
import { useUIStore } from "@/stores/ui-store";
import { useSharedMarketData } from "@/hooks/use-market-data";
import { SymbolSearch } from "@/components/watchlist/symbol-search";
import { WatchlistItem } from "@/components/watchlist/watchlist-item";

export function WatchlistPanel() {
  const { isLoading, error, fetchWatchlists, removeSymbol } =
    useWatchlistStore();
  const activeItems = useWatchlistStore(
    useShallow((s) =>
      s.watchlists.find((w) => w.id === s.activeWatchlistId)?.items ?? [],
    ),
  );
  const { activeSymbol, setSymbol } = useChartStore();
  const leftSidebarCollapsed = useUIStore((s) => s.leftSidebarCollapsed);

  // Shared WebSocket connection
  const { subscribe, unsubscribe, isConnected } = useSharedMarketData();

  // Track previously subscribed symbols to diff on change
  const prevSymbolsRef = useRef<Set<string>>(new Set());

  // Fetch watchlists on mount
  useEffect(() => {
    fetchWatchlists();
  }, [fetchWatchlists]);

  // Subscribe watchlist symbols to WebSocket for live prices
  useEffect(() => {
    if (!isConnected) return;

    const currentSymbols = new Set(activeItems.map((item) => item.symbol));
    const prevSymbols = prevSymbolsRef.current;

    // Subscribe new symbols (in current but not in previous)
    currentSymbols.forEach((symbol) => {
      if (!prevSymbols.has(symbol)) {
        subscribe(symbol, "1m");
      }
    });

    // Unsubscribe removed symbols (in previous but not in current)
    prevSymbols.forEach((symbol) => {
      if (!currentSymbols.has(symbol)) {
        unsubscribe(symbol, "1m");
      }
    });

    prevSymbolsRef.current = currentSymbols;

    return () => {
      // Cleanup: unsubscribe all on unmount
      currentSymbols.forEach((symbol) => {
        unsubscribe(symbol, "1m");
      });
      prevSymbolsRef.current = new Set();
    };
  }, [activeItems, isConnected, subscribe, unsubscribe]);

  // Don't render when sidebar is collapsed
  if (leftSidebarCollapsed) return null;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="px-3 pt-3 pb-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Watchlist
        </h3>
      </div>

      {/* Symbol Search */}
      <SymbolSearch />

      {/* Separator */}
      <div className="border-t border-border" />

      {/* Watchlist items */}
      <div className="flex-1 overflow-y-auto py-1">
        {isLoading && activeItems.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="px-3 py-4 text-xs text-destructive">{error}</div>
        )}

        {!isLoading && !error && activeItems.length === 0 && (
          <div className="px-3 py-4 text-center text-xs text-muted-foreground">
            No symbols in watchlist.
            <br />
            Search to add.
          </div>
        )}

        {activeItems.map((item) => (
          <WatchlistItem
            key={item.symbol}
            symbol={item.symbol}
            isActive={item.symbol === activeSymbol}
            onSelect={() => setSymbol(item.symbol)}
            onRemove={() => removeSymbol(item.symbol)}
          />
        ))}
      </div>
    </div>
  );
}
