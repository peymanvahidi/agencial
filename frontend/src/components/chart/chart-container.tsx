"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ISeriesApi, SeriesType, LogicalRange } from "lightweight-charts";
import { CrosshairMode } from "lightweight-charts";
import { useChart } from "@/components/chart/hooks/use-chart";
import { useCrosshair } from "@/components/chart/hooks/use-crosshair";
import {
  addMainSeries,
  addVolumeSeries,
  updateCandle,
  prependHistory,
  generateSkeletonCandles,
  replaceSkeletonWithReal,
  type SkeletonCandle,
} from "@/components/chart/series-manager";
import { OHLCLegend } from "@/components/chart/ohlc-legend";
import { ChartToolbar } from "@/components/chart/chart-toolbar";
import { ChartToolsSidebar } from "@/components/chart/chart-tools-sidebar";
import { ConnectionBanner } from "@/components/chart/connection-banner";
import { useChartStore } from "@/stores/chart-store";
import { useMarketDataConnection } from "@/hooks/use-market-data";
import { fetchHistoricalCandles } from "@/lib/market-data-api";
import { getMockDataForSymbol, getIntervalSeconds } from "@/lib/mock-data";
import type { OHLCVCandle, PriceUpdate } from "@/types/market-data";
import type { Timeframe } from "@/types/chart";

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
// Constants
// ---------------------------------------------------------------------------

const INITIAL_CANDLE_COUNT = 500;
const HISTORY_FETCH_SIZE = 500;
const SCROLL_THRESHOLD = 10;

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
 * Supports live data via WebSocket with graceful fallback to mock data.
 * Implements infinite scroll with skeleton candle placeholders.
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
  const dataSource = useChartStore((s) => s.dataSource);

  // Chart instance
  const { chartRef } = useChart(canvasWrapperRef);

  // Crosshair OHLC legend data
  const { legendData } = useCrosshair(chartRef, mainSeriesRef);

  // Real-time data refs
  const currentDataRef = useRef<SkeletonCandle[]>([]);
  const isLoadingHistoryRef = useRef(false);
  const prevSubRef = useRef<{ symbol: string; interval: string } | null>(null);
  const rangeListenerRef = useRef<(() => void) | null>(null);

  // ---------------------------------------------------------------------------
  // WebSocket connection with real-time update handler
  // ---------------------------------------------------------------------------

  const onPriceUpdate = useCallback(
    (update: PriceUpdate) => {
      if (
        update.symbol !== activeSymbol ||
        update.interval !== activeTimeframe
      ) {
        return;
      }

      const candle: OHLCVCandle = { ...update.candle };
      updateCandle(
        mainSeriesRef.current,
        volumeSeriesRef.current,
        candle,
        chartType,
      );

      // When candle is closed, append as a new bar in our data ref
      if (update.is_closed) {
        currentDataRef.current = [...currentDataRef.current, candle];
      } else {
        // Update the last candle in currentDataRef for consistency
        const data = currentDataRef.current;
        if (data.length > 0 && data[data.length - 1].time === candle.time) {
          data[data.length - 1] = candle;
        } else if (
          data.length === 0 ||
          data[data.length - 1].time < candle.time
        ) {
          currentDataRef.current = [...data, candle];
        }
      }
    },
    [activeSymbol, activeTimeframe, chartType],
  );

  const { subscribe, unsubscribe, connectionStatus } =
    useMarketDataConnection({ onPriceUpdate });

  // ---------------------------------------------------------------------------
  // Sidebar tool state
  // ---------------------------------------------------------------------------
  const [crosshairActive, setCrosshairActive] = useState(true);
  const [measureActive, setMeasureActive] = useState(false);
  const [measureA, setMeasureA] = useState<MeasurePoint | null>(null);
  const [measureB, setMeasureB] = useState<MeasurePoint | null>(null);

  // ---------------------------------------------------------------------------
  // Helper: Remove and rebuild chart series
  // ---------------------------------------------------------------------------
  const rebuildSeries = useCallback(
    (data: SkeletonCandle[], shouldFitContent: boolean) => {
      const chart = chartRef.current;
      if (!chart) return;

      // Remove existing series
      if (mainSeriesRef.current) {
        try {
          chart.removeSeries(mainSeriesRef.current);
        } catch {
          /* already removed */
        }
        mainSeriesRef.current = null;
      }
      if (volumeSeriesRef.current) {
        try {
          chart.removeSeries(volumeSeriesRef.current);
        } catch {
          /* already removed */
        }
        volumeSeriesRef.current = null;
      }

      // Add new series with data
      mainSeriesRef.current = addMainSeries(chart, chartType, data);
      volumeSeriesRef.current = addVolumeSeries(chart, data);

      if (!shouldFitContent) {
        // Caller will handle visible range restoration
      }

      currentDataRef.current = data;
    },
    [chartRef, chartType],
  );

  // ---------------------------------------------------------------------------
  // Data loading effect: load real or mock data when symbol/timeframe changes
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    let cancelled = false;

    // Unsubscribe from previous WS subscription
    if (prevSubRef.current) {
      unsubscribe(prevSubRef.current.symbol, prevSubRef.current.interval);
    }

    // Determine if this was a timeframe-only change (for range preservation)
    const wasTimeframeChange =
      prevSubRef.current?.symbol === activeSymbol &&
      prevSubRef.current?.interval !== activeTimeframe;

    // Save visible range before data swap (for timeframe switch)
    const savedRange = wasTimeframeChange
      ? chart.timeScale().getVisibleRange()
      : null;

    if (dataSource === "mock") {
      // --- Mock data path ---
      const data = getMockDataForSymbol(activeSymbol, activeTimeframe);
      rebuildSeries(data as SkeletonCandle[], true);
      prevSubRef.current = {
        symbol: activeSymbol,
        interval: activeTimeframe,
      };
      return;
    }

    // --- Live data path ---
    async function loadLiveData() {
      try {
        const candles = await fetchHistoricalCandles(
          activeSymbol,
          activeTimeframe,
          { limit: INITIAL_CANDLE_COUNT },
        );

        if (cancelled) return;

        rebuildSeries(candles as SkeletonCandle[], !savedRange);

        // Restore visible range on timeframe switch
        if (savedRange && chartRef.current) {
          try {
            chartRef.current.timeScale().setVisibleRange(savedRange);
          } catch {
            // Range may be out of new data bounds -- fall back to fitContent
            chartRef.current.timeScale().fitContent();
          }
        }

        // Subscribe to WS for live updates
        subscribe(activeSymbol, activeTimeframe);
        prevSubRef.current = {
          symbol: activeSymbol,
          interval: activeTimeframe,
        };
      } catch (err) {
        if (cancelled) return;

        // Backend unreachable -- fall back to mock data
        console.warn(
          "[chart] Failed to fetch live data, falling back to mock:",
          err,
        );
        const mockData = getMockDataForSymbol(activeSymbol, activeTimeframe);
        rebuildSeries(mockData as SkeletonCandle[], true);
        prevSubRef.current = {
          symbol: activeSymbol,
          interval: activeTimeframe,
        };
      }
    }

    loadLiveData();

    return () => {
      cancelled = true;
    };
  }, [
    activeSymbol,
    activeTimeframe,
    chartRef,
    chartType,
    dataSource,
    subscribe,
    unsubscribe,
    rebuildSeries,
  ]);

  // ---------------------------------------------------------------------------
  // Infinite scroll with skeleton candle loading
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || dataSource === "mock") return;

    // Clean up previous listener
    if (rangeListenerRef.current) {
      rangeListenerRef.current();
      rangeListenerRef.current = null;
    }

    const intervalSeconds = getIntervalSeconds(activeTimeframe as Timeframe);

    const handleRangeChange = (logicalRange: LogicalRange | null) => {
      if (!logicalRange) return;
      if (logicalRange.from >= SCROLL_THRESHOLD) return;
      if (isLoadingHistoryRef.current) return;

      const data = currentDataRef.current;
      if (data.length === 0) return;

      isLoadingHistoryRef.current = true;

      const oldestTime = data[0].time as number;
      const lastKnownPrice = data[0].close;

      // Immediately show skeleton candles
      const skeletons = generateSkeletonCandles(
        HISTORY_FETCH_SIZE,
        oldestTime - intervalSeconds,
        intervalSeconds,
        lastKnownPrice,
      );

      // Save visible range before modifying data
      const preRange = chart.timeScale().getVisibleRange();

      // Prepend skeletons to current data and update chart
      const withSkeletons = prependHistory(
        mainSeriesRef.current,
        volumeSeriesRef.current,
        data,
        skeletons,
        chartType,
      );
      currentDataRef.current = withSkeletons as SkeletonCandle[];

      // Restore visible range so view doesn't jump
      if (preRange) {
        try {
          chart.timeScale().setVisibleRange(preRange);
        } catch {
          /* range out of bounds */
        }
      }

      // Fetch real historical data
      fetchHistoricalCandles(activeSymbol, activeTimeframe, {
        endTime: oldestTime - 1,
        limit: HISTORY_FETCH_SIZE,
      })
        .then((fetchedCandles) => {
          // Save range before replacing
          const preReplaceRange = chart.timeScale().getVisibleRange();

          const updated = replaceSkeletonWithReal(
            mainSeriesRef.current,
            volumeSeriesRef.current,
            currentDataRef.current,
            fetchedCandles,
            chartType,
          );
          currentDataRef.current = updated;

          // Restore visible range
          if (preReplaceRange) {
            try {
              chart.timeScale().setVisibleRange(preReplaceRange);
            } catch {
              /* range out of bounds */
            }
          }

          isLoadingHistoryRef.current = false;
        })
        .catch((err) => {
          console.warn("[chart] Failed to fetch history:", err);

          // Remove skeleton candles on failure
          const preReplaceRange = chart.timeScale().getVisibleRange();

          const cleaned = replaceSkeletonWithReal(
            mainSeriesRef.current,
            volumeSeriesRef.current,
            currentDataRef.current,
            [], // empty = just remove skeletons
            chartType,
          );
          currentDataRef.current = cleaned;

          if (preReplaceRange) {
            try {
              chart.timeScale().setVisibleRange(preReplaceRange);
            } catch {
              /* range out of bounds */
            }
          }

          isLoadingHistoryRef.current = false;
        });
    };

    chart.timeScale().subscribeVisibleLogicalRangeChange(handleRangeChange);

    const cleanup = () => {
      const c = chartRef.current;
      if (c) {
        try {
          c.timeScale().unsubscribeVisibleLogicalRangeChange(handleRangeChange);
        } catch {
          /* chart may be disposed */
        }
      }
    };

    rangeListenerRef.current = cleanup;

    return cleanup;
  }, [chartRef, activeSymbol, activeTimeframe, chartType, dataSource]);

  // Cleanup WS subscription on unmount
  useEffect(() => {
    return () => {
      if (prevSubRef.current) {
        unsubscribe(prevSubRef.current.symbol, prevSubRef.current.interval);
      }
      if (rangeListenerRef.current) {
        rangeListenerRef.current();
        rangeListenerRef.current = null;
      }
    };
  }, [unsubscribe]);

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
          {/* Connection status banner */}
          <ConnectionBanner status={connectionStatus} />

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
