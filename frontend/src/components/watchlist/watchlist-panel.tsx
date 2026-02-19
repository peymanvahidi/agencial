"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useWatchlistStore } from "@/stores/watchlist-store";
import { useChartStore } from "@/stores/chart-store";
import { useUIStore } from "@/stores/ui-store";
import { SymbolSearch } from "@/components/watchlist/symbol-search";
import { WatchlistItem } from "@/components/watchlist/watchlist-item";

export function WatchlistPanel() {
  const { isLoading, error, fetchWatchlists, removeSymbol } =
    useWatchlistStore();
  const activeItems = useWatchlistStore((s) => s.getActiveItems());
  const { activeSymbol, setSymbol } = useChartStore();
  const leftSidebarCollapsed = useUIStore((s) => s.leftSidebarCollapsed);

  // Fetch watchlists on mount
  useEffect(() => {
    fetchWatchlists();
  }, [fetchWatchlists]);

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
