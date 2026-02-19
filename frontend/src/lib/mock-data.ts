import type { OHLCVData, Timeframe } from "@/types/chart";
import { CRYPTO_SYMBOLS, DEFAULT_SYMBOL } from "@/types/chart";

/**
 * Deterministic pseudo-random number generator using a linear congruential generator.
 * Returns a function that produces numbers in [0, 1) for each call.
 */
export function seededRandom(seed: number): () => number {
  let s = seed & 0xffffffff;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

/**
 * Simple string hash function to convert a string to a numeric seed.
 */
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Map a timeframe string to its duration in seconds.
 */
export function getIntervalSeconds(timeframe: Timeframe): number {
  const map: Record<Timeframe, number> = {
    "1m": 60,
    "5m": 300,
    "15m": 900,
    "30m": 1800,
    "1H": 3600,
    "4H": 14400,
    "1D": 86400,
    "1W": 604800,
    "1M": 2592000,
  };
  return map[timeframe];
}

/**
 * Returns a reasonable number of bars to generate for each timeframe.
 */
export function getBarCount(timeframe: Timeframe): number {
  const map: Record<Timeframe, number> = {
    "1m": 1440, // 1 day
    "5m": 1440, // 5 days
    "15m": 1440, // 15 days
    "30m": 1440, // 30 days
    "1H": 720, // 30 days
    "4H": 720, // 120 days
    "1D": 1095, // 3 years
    "1W": 260, // 5 years
    "1M": 120, // 10 years
  };
  return map[timeframe];
}

/**
 * Generate deterministic mock OHLCV data for a given symbol and timeframe.
 *
 * Uses seeded random based on symbol+timeframe so the same inputs always
 * produce the same chart data across page loads.
 */
export function generateMockOHLCV(
  symbol: string,
  timeframe: Timeframe,
  basePrice: number,
  volatility: number,
): OHLCVData[] {
  const seed = hashString(`${symbol}:${timeframe}`);
  const rand = seededRandom(seed);
  const barCount = getBarCount(timeframe);
  const intervalSeconds = getIntervalSeconds(timeframe);

  // Start time: calculated backwards from current time
  const now = Math.floor(Date.now() / 1000);
  const startTime = now - barCount * intervalSeconds;

  const data: OHLCVData[] = [];
  let currentPrice = basePrice;

  for (let i = 0; i < barCount; i++) {
    const time = startTime + i * intervalSeconds;

    // Slight upward bias typical of crypto
    const drift = 0.0001;
    const change = (rand() - 0.5 + drift) * volatility * 2;

    const open = currentPrice;
    const close = open * (1 + change);

    // High/Low extend beyond open/close
    const range = Math.abs(close - open);
    const high = Math.max(open, close) + rand() * range * 0.5;
    const low = Math.min(open, close) - rand() * range * 0.5;

    // Volume varies between 100k and 1M
    const volume = 100000 + rand() * 900000;

    data.push({
      time,
      open: parseFloat(open.toPrecision(8)),
      high: parseFloat(high.toPrecision(8)),
      low: parseFloat(low.toPrecision(8)),
      close: parseFloat(close.toPrecision(8)),
      volume: Math.round(volume),
    });

    currentPrice = close;
  }

  return data;
}

/**
 * Get mock OHLCV data for a symbol string (e.g., "BTCUSDT") and timeframe.
 * Looks up the symbol in CRYPTO_SYMBOLS for basePrice/volatility.
 * Falls back to BTC defaults if symbol not found.
 */
export function getMockDataForSymbol(
  symbolStr: string,
  timeframe: Timeframe,
): OHLCVData[] {
  const found = CRYPTO_SYMBOLS.find((s) => s.symbol === symbolStr);
  const sym = found ?? DEFAULT_SYMBOL;
  return generateMockOHLCV(sym.symbol, timeframe, sym.basePrice, sym.volatility);
}
