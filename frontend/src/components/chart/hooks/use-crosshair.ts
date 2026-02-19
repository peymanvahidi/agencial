"use client";

import { useEffect, useState, useRef, type MutableRefObject } from "react";
import type { IChartApi, ISeriesApi, SeriesType, Time } from "lightweight-charts";

export interface LegendData {
  open: number;
  high: number;
  low: number;
  close: number;
  time: Time;
}

/**
 * Hook that subscribes to crosshair move events and extracts OHLC data
 * from the main series for the OHLC legend overlay.
 *
 * When the mouse leaves the chart, shows the last bar's data instead of null.
 */
export function useCrosshair(
  chartRef: MutableRefObject<IChartApi | null>,
  mainSeriesRef: MutableRefObject<ISeriesApi<SeriesType> | null>,
): { legendData: LegendData | null } {
  const [legendData, setLegendData] = useState<LegendData | null>(null);
  // Keep a ref to the last valid data so mouse-leave shows it
  const lastDataRef = useRef<LegendData | null>(null);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const handler = (param: {
      time?: Time;
      seriesData: Map<ISeriesApi<SeriesType>, unknown>;
    }) => {
      if (!param.time || param.seriesData.size === 0) {
        // Mouse left chart area -- show last known bar data
        if (lastDataRef.current) {
          setLegendData(lastDataRef.current);
        }
        return;
      }

      const series = mainSeriesRef.current;
      if (!series) return;

      const data = param.seriesData.get(series);
      if (!data) return;

      // Type-narrow: OHLC data has 'open' field, line/area data has 'value'
      if (data && typeof data === "object" && "open" in data) {
        const ohlc = data as { open: number; high: number; low: number; close: number };
        const entry: LegendData = {
          open: ohlc.open,
          high: ohlc.high,
          low: ohlc.low,
          close: ohlc.close,
          time: param.time,
        };
        lastDataRef.current = entry;
        setLegendData(entry);
      } else if (data && typeof data === "object" && "value" in data) {
        // For line/area series, use value as all OHLC fields
        const val = (data as { value: number }).value;
        const entry: LegendData = {
          open: val,
          high: val,
          low: val,
          close: val,
          time: param.time,
        };
        lastDataRef.current = entry;
        setLegendData(entry);
      }
    };

    chart.subscribeCrosshairMove(handler);

    return () => {
      chart.unsubscribeCrosshairMove(handler);
    };
  }, [chartRef, mainSeriesRef]);

  return { legendData };
}
