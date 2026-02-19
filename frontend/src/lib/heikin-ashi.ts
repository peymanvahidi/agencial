import type { OHLCData } from "@/types/chart";

/**
 * Transform standard OHLC data to Heikin-Ashi OHLC data.
 *
 * Heikin-Ashi formula:
 *   HA_Close = (Open + High + Low + Close) / 4
 *   HA_Open  = (prev_HA_Open + prev_HA_Close) / 2   (first bar: HA_Open = Open)
 *   HA_High  = max(High, HA_Open, HA_Close)
 *   HA_Low   = min(Low, HA_Open, HA_Close)
 *
 * Pure function -- returns a new array, does not mutate input.
 */
export function toHeikinAshi(data: OHLCData[]): OHLCData[] {
  if (data.length === 0) return [];

  const result: OHLCData[] = [];

  for (let i = 0; i < data.length; i++) {
    const bar = data[i];
    const haClose = (bar.open + bar.high + bar.low + bar.close) / 4;

    let haOpen: number;
    if (i === 0) {
      haOpen = bar.open;
    } else {
      const prev = result[i - 1];
      haOpen = (prev.open + prev.close) / 2;
    }

    const haHigh = Math.max(bar.high, haOpen, haClose);
    const haLow = Math.min(bar.low, haOpen, haClose);

    result.push({
      time: bar.time,
      open: haOpen,
      high: haHigh,
      low: haLow,
      close: haClose,
    });
  }

  return result;
}
