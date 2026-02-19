"use client";

import { useLayoutEffect, useRef, type MutableRefObject, type RefObject } from "react";
import { createChart, type IChartApi } from "lightweight-charts";
import { DEFAULT_CHART_OPTIONS } from "@/lib/chart-config";

/**
 * Hook that manages the lightweight-charts instance lifecycle.
 * Creates the chart in useLayoutEffect (prevents visual flash),
 * sets up ResizeObserver for react-resizable-panels compatibility,
 * and cleans up on unmount.
 *
 * @param containerRef - Ref to the div that will host the chart canvas
 * @returns chartRef - Mutable ref to the IChartApi instance
 */
export function useChart(
  containerRef: RefObject<HTMLDivElement | null>,
): { chartRef: MutableRefObject<IChartApi | null> } {
  const chartRef = useRef<IChartApi | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      ...DEFAULT_CHART_OPTIONS,
    });

    chartRef.current = chart;

    // ResizeObserver handles both window resize and panel drag resize
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        chart.applyOptions({ width, height });
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { chartRef };
}
