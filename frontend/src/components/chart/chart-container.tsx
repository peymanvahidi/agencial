"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ISeriesApi, SeriesType } from "lightweight-charts";
import { CrosshairMode } from "lightweight-charts";
import { useChart } from "@/components/chart/hooks/use-chart";
import { useCrosshair } from "@/components/chart/hooks/use-crosshair";
import {
  addMainSeries,
  addVolumeSeries,
} from "@/components/chart/series-manager";
import { OHLCLegend } from "@/components/chart/ohlc-legend";
import { ChartToolbar } from "@/components/chart/chart-toolbar";
import { ChartToolsSidebar } from "@/components/chart/chart-tools-sidebar";
import { useChartStore } from "@/stores/chart-store";
import { getMockDataForSymbol } from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Measurement point type
// ---------------------------------------------------------------------------

interface MeasurePoint {
  x: number; // pixel x relative to chart canvas wrapper
  y: number; // pixel y relative to chart canvas wrapper
  price: number;
  time: number; // Unix timestamp
}

// ---------------------------------------------------------------------------
// Format helpers for measurement overlay
// ---------------------------------------------------------------------------

function formatPriceDiff(from: number, to: number): string {
  const diff = to - from;
  const pct = ((diff / from) * 100).toFixed(2);
  const sign = diff >= 0 ? "+" : "";
  const absStr = Math.abs(diff) < 1 ? diff.toFixed(4) : diff.toFixed(2);
  return `${sign}${absStr} (${sign}${pct}%)`;
}

function formatTimeDiff(fromTs: number, toTs: number): string {
  const diffSec = Math.abs(toTs - fromTs);
  if (diffSec < 3600) return `${Math.round(diffSec / 60)}m`;
  if (diffSec < 86400) return `${(diffSec / 3600).toFixed(1)}h`;
  return `${(diffSec / 86400).toFixed(1)}d`;
}

// ---------------------------------------------------------------------------
// ChartContainer
// ---------------------------------------------------------------------------

/**
 * Main chart wrapper component integrating all chart logic.
 *
 * Reads state from chart store (activeSymbol, activeTimeframe, chartType, scaleMode),
 * manages the chart instance lifecycle via useChart, subscribes to crosshair for
 * OHLC legend, and handles data loading / series switching.
 *
 * Renders: ChartToolbar (top) + ChartToolsSidebar (left) + chart canvas.
 */
export function ChartContainer() {
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const mainSeriesRef = useRef<ISeriesApi<SeriesType> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<SeriesType> | null>(null);

  // Chart store state
  const activeSymbol = useChartStore((s) => s.activeSymbol);
  const activeTimeframe = useChartStore((s) => s.activeTimeframe);
  const chartType = useChartStore((s) => s.chartType);
  const scaleMode = useChartStore((s) => s.scaleMode);

  // Chart instance
  const { chartRef } = useChart(canvasWrapperRef);

  // Crosshair OHLC legend data
  const { legendData } = useCrosshair(chartRef, mainSeriesRef);

  // ---------------------------------------------------------------------------
  // Sidebar tool state
  // ---------------------------------------------------------------------------
  const [crosshairActive, setCrosshairActive] = useState(true);
  const [measureActive, setMeasureActive] = useState(false);
  const [measureA, setMeasureA] = useState<MeasurePoint | null>(null);
  const [measureB, setMeasureB] = useState<MeasurePoint | null>(null);

  // ---------------------------------------------------------------------------
  // Data loading effect: regenerate mock data when symbol/timeframe changes
  // ---------------------------------------------------------------------------
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

  // Scale mode effect: toggle between linear and logarithmic
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    chart.priceScale("right").applyOptions({
      mode: scaleMode === "logarithmic" ? 1 : 0,
    });
  }, [scaleMode, chartRef]);

  // ---------------------------------------------------------------------------
  // Sidebar tool callbacks
  // ---------------------------------------------------------------------------

  const handleToggleCrosshair = useCallback(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const next = !crosshairActive;
    setCrosshairActive(next);
    chart.applyOptions({
      crosshair: {
        mode: next ? CrosshairMode.Normal : CrosshairMode.Hidden,
      },
    });
  }, [chartRef, crosshairActive]);

  const handleZoomIn = useCallback(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const range = chart.timeScale().getVisibleLogicalRange();
    if (!range) return;
    const bars = range.to - range.from;
    const newBars = bars * 0.8; // shrink visible range by 20%
    chart.timeScale().setVisibleLogicalRange({
      from: range.to - newBars,
      to: range.to,
    });
  }, [chartRef]);

  const handleZoomOut = useCallback(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const range = chart.timeScale().getVisibleLogicalRange();
    if (!range) return;
    const bars = range.to - range.from;
    const newBars = bars * 1.2; // expand visible range by 20%
    chart.timeScale().setVisibleLogicalRange({
      from: range.to - newBars,
      to: range.to,
    });
  }, [chartRef]);

  const handleResetZoom = useCallback(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.timeScale().fitContent();
  }, [chartRef]);

  const handleToggleMeasure = useCallback(() => {
    setMeasureActive((prev) => {
      if (prev) {
        // Turning off -- clear points
        setMeasureA(null);
        setMeasureB(null);
        measureFinalizedRef.current = false;
        measureClearedRef.current = false;
      }
      return !prev;
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Measurement: two-click with live preview on mousemove
  // ---------------------------------------------------------------------------

  const measureFinalizedRef = useRef(false);
  const measureClearedRef = useRef(false);

  const getMeasurePoint = useCallback(
    (event: React.MouseEvent<HTMLDivElement>): MeasurePoint | null => {
      const chart = chartRef.current;
      const series = mainSeriesRef.current;
      const wrapper = canvasWrapperRef.current;
      if (!chart || !series || !wrapper) return null;

      const rect = wrapper.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const timeCoord = chart.timeScale().coordinateToTime(x);
      const priceCoord = series.coordinateToPrice(y);
      if (timeCoord === null || priceCoord === null) return null;

      return { x, y, price: priceCoord, time: timeCoord as number };
    },
    [chartRef],
  );

  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!measureActive) return;
      const point = getMeasurePoint(event);
      if (!point) return;

      if (measureFinalizedRef.current && !measureClearedRef.current) {
        // 3rd click: clear the overlay
        setMeasureA(null);
        setMeasureB(null);
        measureClearedRef.current = true;
        return;
      }

      if (!measureA || measureClearedRef.current) {
        // 1st click (or 4th click after clear): set point A
        setMeasureA(point);
        setMeasureB(null);
        measureFinalizedRef.current = false;
        measureClearedRef.current = false;
      } else {
        // 2nd click: finalize point B
        setMeasureB(point);
        measureFinalizedRef.current = true;
      }
    },
    [measureActive, getMeasurePoint, measureA],
  );

  const handleCanvasMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!measureActive || !measureA || measureFinalizedRef.current) return;
      const point = getMeasurePoint(event);
      if (!point) return;
      setMeasureB(point);
    },
    [measureActive, measureA, getMeasurePoint],
  );

  // Clear measurement on Escape
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape" && measureActive) {
        setMeasureActive(false);
        setMeasureA(null);
        setMeasureB(null);
        measureFinalizedRef.current = false;
        measureClearedRef.current = false;
        return;
      }

      // Existing keyboard shortcuts for chart navigation
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
    [chartRef, measureActive],
  );

  // ---------------------------------------------------------------------------
  // Measurement overlay position / dimensions
  // ---------------------------------------------------------------------------

  const measureOverlay =
    measureA && measureB ? (
      <div
        className="pointer-events-none absolute z-20"
        style={{
          left: Math.min(measureA.x, measureB.x),
          top: Math.min(measureA.y, measureB.y),
          width: Math.abs(measureB.x - measureA.x) || 1,
          height: Math.abs(measureB.y - measureA.y) || 1,
          backgroundColor:
            measureB.price >= measureA.price
              ? "rgba(38, 166, 154, 0.12)"
              : "rgba(239, 83, 80, 0.12)",
          border: `1px dashed ${
            measureB.price >= measureA.price
              ? "rgba(38, 166, 154, 0.5)"
              : "rgba(239, 83, 80, 0.5)"
          }`,
        }}
      >
        {/* Label positioned at the midpoint of the overlay */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded px-2 py-1 text-xs"
          style={{
            backgroundColor: "#1e222ddd",
            color: "#fff",
            fontFamily: "monospace",
            fontSize: "11px",
          }}
        >
          <div>{formatPriceDiff(measureA.price, measureB.price)}</div>
          <div className="text-white/50">
            {formatTimeDiff(measureA.time, measureB.time)}
          </div>
        </div>
      </div>
    ) : null;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div
      className="flex h-full w-full flex-col"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Top toolbar */}
      <ChartToolbar />

      {/* Chart area: sidebar + canvas */}
      <div className="flex flex-1 min-h-0">
        {/* Left tools sidebar */}
        <ChartToolsSidebar
          onToggleCrosshair={handleToggleCrosshair}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
          onToggleMeasure={handleToggleMeasure}
          crosshairActive={crosshairActive}
          measureActive={measureActive}
        />

        {/* Chart canvas wrapper */}
        <div
          className="relative flex-1"
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          style={{
            cursor: measureActive ? "crosshair" : undefined,
          }}
        >
          {/* OHLC Legend overlay */}
          <OHLCLegend
            symbol={activeSymbol}
            open={legendData?.open ?? null}
            high={legendData?.high ?? null}
            low={legendData?.low ?? null}
            close={legendData?.close ?? null}
            chartType={chartType}
          />

          {/* Measurement overlay */}
          {measureOverlay}

          {/* Chart canvas */}
          <div
            ref={canvasWrapperRef}
            className="h-full w-full"
            style={{
              border: "1px solid #2a2e39",
              borderRadius: "2px",
            }}
          />
        </div>
      </div>
    </div>
  );
}
