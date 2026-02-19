"use client";

import { useCallback, useEffect, useRef } from "react";
import type { ISeriesApi, SeriesType } from "lightweight-charts";
import { useChart } from "@/components/chart/hooks/use-chart";
import { useCrosshair } from "@/components/chart/hooks/use-crosshair";
import { addMainSeries, addVolumeSeries } from "@/components/chart/series-manager";
import { OHLCLegend } from "@/components/chart/ohlc-legend";
import { useChartStore } from "@/stores/chart-store";
import { getMockDataForSymbol } from "@/lib/mock-data";

/**
 * Main chart wrapper component integrating all chart logic.
 *
 * Reads state from chart store (activeSymbol, activeTimeframe, chartType, scaleMode),
 * manages the chart instance lifecycle via useChart, subscribes to crosshair for
 * OHLC legend, and handles data loading / series switching.
 */
export function ChartContainer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainSeriesRef = useRef<ISeriesApi<SeriesType> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<SeriesType> | null>(null);

  // Chart store state
  const activeSymbol = useChartStore((s) => s.activeSymbol);
  const activeTimeframe = useChartStore((s) => s.activeTimeframe);
  const chartType = useChartStore((s) => s.chartType);
  const scaleMode = useChartStore((s) => s.scaleMode);

  // Chart instance
  const { chartRef } = useChart(containerRef);

  // Crosshair OHLC legend data
  const { legendData } = useCrosshair(chartRef, mainSeriesRef);

  // Data loading effect: regenerate mock data when symbol/timeframe changes
  useEffect(() => {
    const data = getMockDataForSymbol(activeSymbol, activeTimeframe);

    const chart = chartRef.current;
    if (!chart) return;

    // Remove existing series before adding new ones
    if (mainSeriesRef.current) {
      try {
        chart.removeSeries(mainSeriesRef.current);
      } catch {
        // Series may already have been removed
      }
      mainSeriesRef.current = null;
    }
    if (volumeSeriesRef.current) {
      try {
        chart.removeSeries(volumeSeriesRef.current);
      } catch {
        // Series may already have been removed
      }
      volumeSeriesRef.current = null;
    }

    // Add new series
    mainSeriesRef.current = addMainSeries(chart, chartType, data);
    volumeSeriesRef.current = addVolumeSeries(chart, data);
  }, [activeSymbol, activeTimeframe, chartRef, chartType]);

  // Chart type switching effect: when chart type changes but data stays the same
  // This is handled by the data loading effect above since chartType is in its deps.
  // Keeping this comment for clarity -- chartType change triggers full series rebuild.

  // Scale mode effect: toggle between linear and logarithmic
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    chart.priceScale("right").applyOptions({
      mode: scaleMode === "logarithmic" ? 1 : 0,
    });
  }, [scaleMode, chartRef]);

  // Keyboard shortcuts for chart navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const chart = chartRef.current;
      if (!chart) return;

      const timeScale = chart.timeScale();
      const logicalRange = timeScale.getVisibleLogicalRange();
      if (!logicalRange) return;

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          timeScale.scrollToPosition(timeScale.scrollPosition() - 10, false);
          break;
        case "ArrowRight":
          event.preventDefault();
          timeScale.scrollToPosition(timeScale.scrollPosition() + 10, false);
          break;
        case "ArrowUp": {
          event.preventDefault();
          // Zoom in (reduce visible bars by 12.5%)
          const barsIn = logicalRange.to - logicalRange.from;
          const newBarsIn = barsIn * 0.875;
          timeScale.setVisibleLogicalRange({
            from: logicalRange.to - newBarsIn,
            to: logicalRange.to,
          });
          break;
        }
        case "ArrowDown": {
          event.preventDefault();
          // Zoom out (increase visible bars by 12.5%)
          const barsOut = logicalRange.to - logicalRange.from;
          const newBarsOut = barsOut * 1.125;
          timeScale.setVisibleLogicalRange({
            from: logicalRange.to - newBarsOut,
            to: logicalRange.to,
          });
          break;
        }
      }
    },
    [chartRef],
  );

  return (
    <div className="relative h-full w-full" tabIndex={0} onKeyDown={handleKeyDown}>
      {/* OHLC Legend overlay */}
      <OHLCLegend
        symbol={activeSymbol}
        open={legendData?.open ?? null}
        high={legendData?.high ?? null}
        low={legendData?.low ?? null}
        close={legendData?.close ?? null}
        chartType={chartType}
      />

      {/* Chart canvas container */}
      <div
        ref={containerRef}
        className="h-full w-full"
        style={{
          border: "1px solid #2a2e39",
          borderRadius: "2px",
        }}
      />
    </div>
  );
}
