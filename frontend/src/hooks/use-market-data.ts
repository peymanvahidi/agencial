"use client";

import { useEffect, useRef, useCallback } from "react";
import { useMarketDataStore } from "@/stores/market-data-store";
import type {
  SubscribeMessage,
  ServerMessage,
  PriceUpdate,
  OHLCVCandle,
} from "@/types/market-data";

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ||
  "ws://localhost:8000/api/v1/market-data/ws";

/** Max reconnect attempts before marking status as "disconnected" */
const MAX_RECONNECT_BEFORE_DISCONNECT = 5;

interface UseMarketDataOptions {
  /** Callback invoked on each real-time price update */
  onPriceUpdate?: (update: PriceUpdate) => void;
}

export function useMarketDataConnection(options: UseMarketDataOptions = {}) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const store = useMarketDataStore;
  const connectionStatus = useMarketDataStore(
    (state) => state.connectionStatus,
  );

  const connect = useCallback(() => {
    // Prevent duplicate connections
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.CONNECTING ||
        wsRef.current.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    store.getState().setConnectionStatus("connecting");

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      store.getState().setConnectionStatus("connected");

      // Re-subscribe to all active subscriptions on reconnect
      const subs = store.getState().activeSubscriptions;
      subs.forEach((key) => {
        const [symbol, interval] = key.split("@");
        const msg: SubscribeMessage = {
          action: "subscribe",
          symbol,
          interval,
        };
        ws.send(JSON.stringify(msg));
      });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ServerMessage;

        switch (data.type) {
          case "price_update": {
            const candle: OHLCVCandle = { ...data.candle };
            store.getState().updateLatestPrice(data.symbol, candle);
            optionsRef.current.onPriceUpdate?.(data);
            break;
          }
          case "connection_status": {
            // Server-side connection status notification
            if (data.status === "error") {
              console.warn(
                "[market-data] Server connection error:",
                data.message,
              );
            }
            break;
          }
          case "subscribed":
          case "unsubscribed": {
            // Subscription confirmation -- no action needed
            break;
          }
        }
      } catch (err) {
        console.error("[market-data] Failed to parse WS message:", err);
      }
    };

    ws.onclose = () => {
      const state = store.getState();
      const attempt = state.reconnectAttempt;

      if (attempt >= MAX_RECONNECT_BEFORE_DISCONNECT) {
        state.setConnectionStatus("disconnected");
      } else {
        state.setConnectionStatus("reconnecting");
      }
      state.incrementReconnectAttempt();

      // Exponential backoff with jitter
      const delay =
        Math.min(1000 * Math.pow(2, attempt), 30000) + Math.random() * 1000;
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, delay);
    };

    ws.onerror = (err) => {
      console.error("[market-data] WebSocket error:", err);
      // onclose will fire after onerror, handling reconnection
    };
  }, [store]);

  // Connect on mount, cleanup on unmount
  useEffect(() => {
    connect();

    return () => {
      // Clear any pending reconnect
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      // Close WebSocket
      if (wsRef.current) {
        wsRef.current.onclose = null; // Prevent reconnect on intentional close
        wsRef.current.close();
        wsRef.current = null;
      }
      store.getState().setConnectionStatus("disconnected");
    };
  }, [connect, store]);

  const subscribe = useCallback(
    (symbol: string, interval: string) => {
      store.getState().addSubscription(symbol, interval);

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const msg: SubscribeMessage = {
          action: "subscribe",
          symbol,
          interval,
        };
        wsRef.current.send(JSON.stringify(msg));
      }
    },
    [store],
  );

  const unsubscribe = useCallback(
    (symbol: string, interval: string) => {
      store.getState().removeSubscription(symbol, interval);

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const msg: SubscribeMessage = {
          action: "unsubscribe",
          symbol,
          interval,
        };
        wsRef.current.send(JSON.stringify(msg));
      }
    },
    [store],
  );

  return {
    subscribe,
    unsubscribe,
    connectionStatus,
    isConnected: connectionStatus === "connected",
  };
}
