"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { CRYPTO_SYMBOLS } from "@/types/chart";
import { useWatchlistStore } from "@/stores/watchlist-store";
import { useChartStore } from "@/stores/chart-store";

export function SymbolSearch() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const addSymbol = useWatchlistStore((s) => s.addSymbol);
  const setSymbol = useChartStore((s) => s.setSymbol);
  const activeItems = useWatchlistStore((s) => s.getActiveItems());

  // Filter symbols based on search query
  const filteredSymbols = query.trim()
    ? CRYPTO_SYMBOLS.filter(
        (s) =>
          s.symbol.toLowerCase().includes(query.toLowerCase()) ||
          s.name.toLowerCase().includes(query.toLowerCase()),
      )
    : [];

  // Track which symbols are already in the watchlist
  const watchlistSymbols = new Set(activeItems.map((item) => item.symbol));

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    async (symbol: string) => {
      const isAlreadyAdded = watchlistSymbols.has(symbol);

      if (!isAlreadyAdded) {
        await addSymbol(symbol);
      }

      // Always switch chart to the selected symbol
      setSymbol(symbol);

      // Clear search and close
      setQuery("");
      setIsOpen(false);
    },
    [addSymbol, setSymbol, watchlistSymbols],
  );

  return (
    <div className="relative px-3 py-2">
      {/* Search input */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(e.target.value.trim().length > 0);
          }}
          onFocus={() => {
            if (query.trim().length > 0) setIsOpen(true);
          }}
          placeholder="Search symbols..."
          className="h-7 w-full rounded-md border border-border bg-background pl-7 pr-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
        />
      </div>

      {/* Dropdown results */}
      {isOpen && filteredSymbols.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute left-2 right-2 z-50 mt-1 max-h-48 overflow-y-auto rounded-md border border-border bg-popover shadow-lg"
        >
          {filteredSymbols.map((crypto) => {
            const isAdded = watchlistSymbols.has(crypto.symbol);
            return (
              <button
                key={crypto.symbol}
                className="flex w-full items-center justify-between px-3 py-1.5 text-xs transition-colors hover:bg-sidebar-accent"
                onClick={() => handleSelect(crypto.symbol)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {crypto.symbol}
                  </span>
                  <span className="text-muted-foreground">{crypto.name}</span>
                </div>
                {isAdded ? (
                  <Check className="h-3.5 w-3.5 text-green-400" />
                ) : (
                  <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* No results message */}
      {isOpen && query.trim().length > 0 && filteredSymbols.length === 0 && (
        <div
          ref={dropdownRef}
          className="absolute left-2 right-2 z-50 mt-1 rounded-md border border-border bg-popover px-3 py-2 text-xs text-muted-foreground shadow-lg"
        >
          No matching symbols
        </div>
      )}
    </div>
  );
}
