"use client";

import { useEffect, useRef, useCallback } from "react";
import { useMarketDataStore } from "@/stores/market-data-store";
import type {
  SubscribeMessage,
  ServerMessage,
  PriceUpdate,
} from "@/types/market-data";

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ||
  "ws://localhost:8000/api/v1/market-data/ws";

/** Max reconnect attempts before marking status as "disconnected" */
const MAX_RECONNECT_BEFORE_DISCONNECT = 5;

// ---------------------------------------------------------------------------
// Module-level singleton manager
// ---------------------------------------------------------------------------

const singleton = {
  ws: null as WebSocket | null,
  reconnectTimeout: null as ReturnType<typeof setTimeout> | null,
  mountCount: 0,
  priceCallbacks: new Map<string, Set<(update: PriceUpdate) => void>>(),
};

const store = useMarketDataStore;

function connect(): void {
  // Prevent duplicate connections
  if (
    singleton.ws &&
    (singleton.ws.readyState === WebSocket.CONNECTING ||
      singleton.ws.readyState === WebSocket.OPEN)
  ) {
    return;
  }

  store.getState().setConnectionStatus("connecting");

  const ws = new WebSocket(WS_URL);
  singleton.ws = ws;

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
          const candle = { ...data.candle };
          store.getState().updateLatestPrice(data.symbol, candle);

          // Notify all registered callbacks for this symbol
          const callbacks = singleton.priceCallbacks.get(data.symbol);
          if (callbacks) {
            callbacks.forEach((cb) => cb(data));
          }
          break;
        }
        case "connection_status": {
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
    singleton.reconnectTimeout = setTimeout(() => {
      connect();
    }, delay);
  };

  ws.onerror = (err) => {
    console.error("[market-data] WebSocket error:", err);
    // onclose will fire after onerror, handling reconnection
  };
}

function disconnect(): void {
  // Clear any pending reconnect
  if (singleton.reconnectTimeout) {
    clearTimeout(singleton.reconnectTimeout);
    singleton.reconnectTimeout = null;
  }
  // Close WebSocket without triggering reconnect
  if (singleton.ws) {
    singleton.ws.onclose = null;
    singleton.ws.close();
    singleton.ws = null;
  }
  store.getState().setConnectionStatus("disconnected");
}

// ---------------------------------------------------------------------------
// Shared hook
// ---------------------------------------------------------------------------

interface UseSharedMarketDataOptions {
  /** Callback invoked on real-time price updates for subscribed symbols */
  onPriceUpdate?: (update: PriceUpdate) => void;
  /** Symbols this component cares about for its onPriceUpdate callback */
  symbols?: string[];
}

export function useSharedMarketData(
  options: UseSharedMarketDataOptions = {},
) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const connectionStatus = useMarketDataStore(
    (state) => state.connectionStatus,
  );

  // Manage mount count: connect on first mount, disconnect on last unmount
  useEffect(() => {
    singleton.mountCount++;
    if (singleton.mountCount === 1) {
      connect();
    }

    return () => {
      singleton.mountCount--;
      if (singleton.mountCount === 0) {
        disconnect();
      }
    };
  }, []);

  // Register per-symbol callbacks for onPriceUpdate
  useEffect(() => {
    const { onPriceUpdate, symbols } = optionsRef.current;
    if (!onPriceUpdate || !symbols || symbols.length === 0) return;

    // Register callback for each symbol
    for (const symbol of symbols) {
      let callbacks = singleton.priceCallbacks.get(symbol);
      if (!callbacks) {
        callbacks = new Set();
        singleton.priceCallbacks.set(symbol, callbacks);
      }
      callbacks.add(onPriceUpdate);
    }

    return () => {
      // Unregister callback for each symbol
      for (const symbol of symbols) {
        const callbacks = singleton.priceCallbacks.get(symbol);
        if (callbacks) {
          callbacks.delete(onPriceUpdate);
          if (callbacks.size === 0) {
            singleton.priceCallbacks.delete(symbol);
          }
        }
      }
    };
    // Re-register when symbols change or onPriceUpdate identity changes
    // Using JSON.stringify for stable dependency on the symbols array content
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.onPriceUpdate, JSON.stringify(options.symbols)]);

  const subscribe = useCallback((symbol: string, interval: string) => {
    store.getState().addSubscription(symbol, interval);

    if (singleton.ws && singleton.ws.readyState === WebSocket.OPEN) {
      const msg: SubscribeMessage = {
        action: "subscribe",
        symbol,
        interval,
      };
      singleton.ws.send(JSON.stringify(msg));
    }
  }, []);

  const unsubscribe = useCallback((symbol: string, interval: string) => {
    store.getState().removeSubscription(symbol, interval);

    if (singleton.ws && singleton.ws.readyState === WebSocket.OPEN) {
      const msg: SubscribeMessage = {
        action: "unsubscribe",
        symbol,
        interval,
      };
      singleton.ws.send(JSON.stringify(msg));
    }
  }, []);

  return {
    subscribe,
    unsubscribe,
    connectionStatus,
    isConnected: connectionStatus === "connected",
  };
}

/**
 * @deprecated Use `useSharedMarketData` instead. This alias exists for
 * backwards compatibility and delegates to the singleton implementation.
 */
export function useMarketDataConnection(
  options: { onPriceUpdate?: (update: PriceUpdate) => void } = {},
) {
  return useSharedMarketData({
    onPriceUpdate: options.onPriceUpdate,
  });
}
