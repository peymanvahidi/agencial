"use client";

import { create } from "zustand";
import { apiGet, apiPost, apiDelete } from "@/lib/api";

// --- Types matching backend WatchlistResponse ---

interface WatchlistItem {
  symbol: string;
  sort_order: number;
  added_at: string;
}

interface Watchlist {
  id: string;
  name: string;
  items: WatchlistItem[];
  created_at: string;
}

// Stable empty array to avoid new reference on each selector call
const EMPTY_ITEMS: WatchlistItem[] = [];

interface WatchlistState {
  // State
  watchlists: Watchlist[];
  activeWatchlistId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchWatchlists: () => Promise<void>;
  addSymbol: (symbol: string) => Promise<void>;
  removeSymbol: (symbol: string) => Promise<void>;
  setActiveWatchlist: (id: string) => void;

  // Derived
  getActiveItems: () => WatchlistItem[];
}

export const useWatchlistStore = create<WatchlistState>()((set, get) => ({
  watchlists: [],
  activeWatchlistId: null,
  isLoading: false,
  error: null,

  fetchWatchlists: async () => {
    set({ isLoading: true, error: null });
    try {
      const watchlists = await apiGet<Watchlist[]>("/api/v1/watchlists");
      const currentActiveId = get().activeWatchlistId;
      set({
        watchlists,
        activeWatchlistId:
          currentActiveId && watchlists.some((w) => w.id === currentActiveId)
            ? currentActiveId
            : watchlists[0]?.id ?? null,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch watchlists",
        isLoading: false,
      });
    }
  },

  addSymbol: async (symbol: string) => {
    const { activeWatchlistId, watchlists } = get();
    if (!activeWatchlistId) return;

    // Optimistic update: add the item immediately
    const optimisticItem: WatchlistItem = {
      symbol,
      sort_order: 999,
      added_at: new Date().toISOString(),
    };
    const prevWatchlists = watchlists;
    set({
      watchlists: watchlists.map((w) =>
        w.id === activeWatchlistId
          ? { ...w, items: [...w.items, optimisticItem] }
          : w,
      ),
    });

    try {
      await apiPost(`/api/v1/watchlists/${activeWatchlistId}/items`, {
        symbol,
      });
      // Re-fetch to get the correct sort_order and added_at from the server
      await get().fetchWatchlists();
    } catch {
      // Rollback on error
      set({ watchlists: prevWatchlists });
    }
  },

  removeSymbol: async (symbol: string) => {
    const { activeWatchlistId, watchlists } = get();
    if (!activeWatchlistId) return;

    // Optimistic update: remove the item immediately
    const prevWatchlists = watchlists;
    set({
      watchlists: watchlists.map((w) =>
        w.id === activeWatchlistId
          ? { ...w, items: w.items.filter((item) => item.symbol !== symbol) }
          : w,
      ),
    });

    try {
      await apiDelete(
        `/api/v1/watchlists/${activeWatchlistId}/items/${symbol}`,
      );
    } catch {
      // Rollback on error
      set({ watchlists: prevWatchlists });
    }
  },

  setActiveWatchlist: (id: string) => set({ activeWatchlistId: id }),

  getActiveItems: () => {
    const { watchlists, activeWatchlistId } = get();
    return (
      watchlists.find((w) => w.id === activeWatchlistId)?.items ?? EMPTY_ITEMS
    );
  },
}));
