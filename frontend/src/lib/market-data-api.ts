import { apiGet } from "@/lib/api";
import type {
  OHLCVCandle,
  HistoricalResponse,
  AssetClass,
} from "@/types/market-data";

interface FetchHistoricalOptions {
  startTime?: number;
  endTime?: number;
  limit?: number;
}

/**
 * Fetch historical OHLCV candles for a symbol and interval.
 * Proxied through Next.js rewrites to the backend.
 */
export async function fetchHistoricalCandles(
  symbol: string,
  interval: string,
  options: FetchHistoricalOptions = {},
): Promise<OHLCVCandle[]> {
  const params = new URLSearchParams();
  params.set("symbol", symbol);
  params.set("interval", interval);

  if (options.startTime !== undefined) {
    params.set("start_time", String(options.startTime));
  }
  if (options.endTime !== undefined) {
    params.set("end_time", String(options.endTime));
  }
  if (options.limit !== undefined) {
    params.set("limit", String(options.limit));
  }

  const response = await apiGet<HistoricalResponse>(
    `/api/v1/market-data/history?${params.toString()}`,
  );
  return response.candles;
}

/**
 * Fetch the list of available symbols for a given asset class.
 */
export async function fetchAvailableSymbols(
  assetClass: AssetClass,
): Promise<string[]> {
  return apiGet<string[]>(
    `/api/v1/market-data/symbols?asset_class=${assetClass}`,
  );
}
