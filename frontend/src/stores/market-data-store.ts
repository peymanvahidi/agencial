"use client";

import { create } from "zustand";
import type { ConnectionStatus, OHLCVCandle } from "@/types/market-data";

interface MarketDataState {
  // State
  connectionStatus: ConnectionStatus;
  reconnectAttempt: number;
  lastConnected: number | null;
  activeSubscriptions: Set<string>;
  latestPrices: Map<string, OHLCVCandle>;

  // Actions
  setConnectionStatus: (status: ConnectionStatus) => void;
  incrementReconnectAttempt: () => void;
  addSubscription: (symbol: string, interval: string) => void;
  removeSubscription: (symbol: string, interval: string) => void;
  clearSubscriptions: () => void;
  updateLatestPrice: (symbol: string, candle: OHLCVCandle) => void;
  getLatestPrice: (symbol: string) => OHLCVCandle | undefined;
}

export const useMarketDataStore = create<MarketDataState>()((set, get) => ({
  connectionStatus: "disconnected",
  reconnectAttempt: 0,
  lastConnected: null,
  activeSubscriptions: new Set<string>(),
  latestPrices: new Map<string, OHLCVCandle>(),

  setConnectionStatus: (status: ConnectionStatus) =>
    set((state) => ({
      connectionStatus: status,
      ...(status === "connected"
        ? { reconnectAttempt: 0, lastConnected: Date.now() }
        : {}),
      // Force new Set reference so Zustand detects change
      activeSubscriptions: new Set(state.activeSubscriptions),
    })),

  incrementReconnectAttempt: () =>
    set((state) => ({
      reconnectAttempt: state.reconnectAttempt + 1,
    })),

  addSubscription: (symbol: string, interval: string) =>
    set((state) => {
      const key = `${symbol}@${interval}`;
      const next = new Set(state.activeSubscriptions);
      next.add(key);
      return { activeSubscriptions: next };
    }),

  removeSubscription: (symbol: string, interval: string) =>
    set((state) => {
      const key = `${symbol}@${interval}`;
      const next = new Set(state.activeSubscriptions);
      next.delete(key);
      return { activeSubscriptions: next };
    }),

  clearSubscriptions: () =>
    set({ activeSubscriptions: new Set<string>() }),

  updateLatestPrice: (symbol: string, candle: OHLCVCandle) =>
    set((state) => {
      const next = new Map(state.latestPrices);
      next.set(symbol, candle);
      return { latestPrices: next };
    }),

  getLatestPrice: (symbol: string) => {
    return get().latestPrices.get(symbol);
  },
}));
