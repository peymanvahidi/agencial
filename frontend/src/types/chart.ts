// Chart type definitions shared across the charting module

// --- Core Data Types ---

export interface OHLCData {
  time: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface OHLCVData extends OHLCData {
  volume: number;
}

// --- Enumerations ---

export type ChartType =
  | "candlestick"
  | "heikin-ashi"
  | "ohlc"
  | "line"
  | "area";

export type Timeframe =
  | "1m"
  | "5m"
  | "15m"
  | "30m"
  | "1H"
  | "4H"
  | "1D"
  | "1W"
  | "1M";

export type ScaleMode = "linear" | "logarithmic";

// --- Timeframe Metadata ---

export interface TimeframeMeta {
  value: Timeframe;
  label: string;
  seconds: number;
}

export const TIMEFRAMES: TimeframeMeta[] = [
  { value: "1m", label: "1m", seconds: 60 },
  { value: "5m", label: "5m", seconds: 300 },
  { value: "15m", label: "15m", seconds: 900 },
  { value: "30m", label: "30m", seconds: 1800 },
  { value: "1H", label: "1H", seconds: 3600 },
  { value: "4H", label: "4H", seconds: 14400 },
  { value: "1D", label: "1D", seconds: 86400 },
  { value: "1W", label: "1W", seconds: 604800 },
  { value: "1M", label: "1M", seconds: 2592000 },
];

// --- Crypto Symbols ---

export interface CryptoSymbol {
  symbol: string;
  name: string;
  basePrice: number;
  volatility: number;
}

export const CRYPTO_SYMBOLS: CryptoSymbol[] = [
  { symbol: "BTCUSDT", name: "Bitcoin", basePrice: 67000, volatility: 0.025 },
  { symbol: "ETHUSDT", name: "Ethereum", basePrice: 3400, volatility: 0.03 },
  { symbol: "SOLUSDT", name: "Solana", basePrice: 175, volatility: 0.04 },
  { symbol: "BNBUSDT", name: "BNB", basePrice: 600, volatility: 0.025 },
  { symbol: "XRPUSDT", name: "XRP", basePrice: 0.62, volatility: 0.035 },
  { symbol: "ADAUSDT", name: "Cardano", basePrice: 0.45, volatility: 0.04 },
  { symbol: "DOGEUSDT", name: "Dogecoin", basePrice: 0.08, volatility: 0.05 },
  { symbol: "AVAXUSDT", name: "Avalanche", basePrice: 35, volatility: 0.04 },
  { symbol: "DOTUSDT", name: "Polkadot", basePrice: 7.5, volatility: 0.035 },
  { symbol: "LINKUSDT", name: "Chainlink", basePrice: 15, volatility: 0.035 },
];

// --- Forex Symbols ---

export interface ForexSymbol {
  symbol: string;
  name: string;
}

export const FOREX_SYMBOLS: ForexSymbol[] = [
  // Major pairs
  { symbol: "EUR/USD", name: "Euro / US Dollar" },
  { symbol: "GBP/USD", name: "British Pound / US Dollar" },
  { symbol: "USD/JPY", name: "US Dollar / Japanese Yen" },
  { symbol: "USD/CHF", name: "US Dollar / Swiss Franc" },
  { symbol: "AUD/USD", name: "Australian Dollar / US Dollar" },
  { symbol: "NZD/USD", name: "New Zealand Dollar / US Dollar" },
  { symbol: "USD/CAD", name: "US Dollar / Canadian Dollar" },
  // Minor pairs
  { symbol: "EUR/GBP", name: "Euro / British Pound" },
  { symbol: "EUR/JPY", name: "Euro / Japanese Yen" },
  { symbol: "GBP/JPY", name: "British Pound / Japanese Yen" },
  { symbol: "AUD/JPY", name: "Australian Dollar / Japanese Yen" },
  { symbol: "EUR/AUD", name: "Euro / Australian Dollar" },
  { symbol: "GBP/AUD", name: "British Pound / Australian Dollar" },
  { symbol: "EUR/CAD", name: "Euro / Canadian Dollar" },
  { symbol: "GBP/CAD", name: "British Pound / Canadian Dollar" },
  { symbol: "AUD/NZD", name: "Australian Dollar / New Zealand Dollar" },
  { symbol: "EUR/NZD", name: "Euro / New Zealand Dollar" },
  { symbol: "CHF/JPY", name: "Swiss Franc / Japanese Yen" },
  { symbol: "CAD/JPY", name: "Canadian Dollar / Japanese Yen" },
  { symbol: "NZD/JPY", name: "New Zealand Dollar / Japanese Yen" },
  { symbol: "EUR/CHF", name: "Euro / Swiss Franc" },
  { symbol: "GBP/CHF", name: "British Pound / Swiss Franc" },
  { symbol: "AUD/CAD", name: "Australian Dollar / Canadian Dollar" },
  { symbol: "NZD/CAD", name: "New Zealand Dollar / Canadian Dollar" },
  { symbol: "GBP/NZD", name: "British Pound / New Zealand Dollar" },
];

/** Union type for any symbol info (crypto or forex) */
export type SymbolInfo = CryptoSymbol | ForexSymbol;

// --- Defaults ---

export const DEFAULT_SYMBOL: CryptoSymbol = CRYPTO_SYMBOLS[0];
export const DEFAULT_TIMEFRAME: Timeframe = "1D";
export const DEFAULT_CHART_TYPE: ChartType = "candlestick";
