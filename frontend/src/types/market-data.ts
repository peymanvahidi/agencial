// Market data types for WebSocket messages, connection state, and historical data

// --- Asset Classification ---
export type AssetClass = "crypto" | "forex";

export function detectAssetClass(symbol: string): AssetClass {
  return symbol.includes("/") ? "forex" : "crypto";
}

// --- WebSocket Message Types ---

/** Client -> Server: subscribe/unsubscribe to a symbol stream */
export interface SubscribeMessage {
  action: "subscribe" | "unsubscribe";
  symbol: string;
  interval: string;
}

/** Server -> Client: real-time candle update */
export interface PriceUpdate {
  type: "price_update";
  symbol: string;
  interval: string;
  candle: {
    time: number; // Unix seconds
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  };
  is_closed: boolean;
}

/** Server -> Client: connection status notification */
export interface ConnectionStatusMessage {
  type: "connection_status";
  status: "connected" | "reconnecting" | "error";
  message?: string;
}

/** Server -> Client: subscription confirmation */
export interface SubscriptionConfirm {
  type: "subscribed" | "unsubscribed";
  symbol: string;
  interval: string;
}

/** Union of all server -> client message types */
export type ServerMessage =
  | PriceUpdate
  | ConnectionStatusMessage
  | SubscriptionConfirm;

// --- Connection State ---
export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting";

// --- Historical Data ---
export interface OHLCVCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface HistoricalResponse {
  symbol: string;
  interval: string;
  candles: OHLCVCandle[];
}
