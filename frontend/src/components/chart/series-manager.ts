import {
  CandlestickSeries,
  BarSeries,
  LineSeries,
  AreaSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type SeriesType,
  type UTCTimestamp,
} from "lightweight-charts";
import type { ChartType, OHLCVData, OHLCData } from "@/types/chart";
import type { OHLCVCandle } from "@/types/market-data";
import { getSeriesOptions, VOLUME_PRICE_SCALE_OPTIONS } from "@/lib/chart-config";
import { toHeikinAshi } from "@/lib/heikin-ashi";

/** Extended candle type with optional skeleton flag for loading placeholders */
export interface SkeletonCandle extends OHLCVCandle {
  _skeleton?: boolean;
}

/**
 * Cast OHLCData time field to lightweight-charts UTCTimestamp.
 * Our mock data generates Unix timestamps as plain numbers, but
 * lightweight-charts v5 uses a branded UTCTimestamp type.
 */
function castTime(time: string | number): UTCTimestamp {
  return time as UTCTimestamp;
}

/**
 * Map chart type to the lightweight-charts series constructor.
 * Heikin-Ashi uses the same CandlestickSeries -- only the data is transformed.
 */
const SERIES_CONSTRUCTORS = {
  candlestick: CandlestickSeries,
  "heikin-ashi": CandlestickSeries,
  ohlc: BarSeries,
  line: LineSeries,
  area: AreaSeries,
} as const;

/**
 * Add the main price series to the chart.
 *
 * Handles data transformation for Heikin-Ashi and value-based series (line/area).
 * Applies correct series options from chart-config.
 * Calls fitContent() after setting data.
 */
export function addMainSeries(
  chart: IChartApi,
  chartType: ChartType,
  data: OHLCVData[],
): ISeriesApi<SeriesType> {
  const SeriesConstructor = SERIES_CONSTRUCTORS[chartType];
  const options = getSeriesOptions(chartType);

  const series = chart.addSeries(SeriesConstructor, options);

  // Transform data based on chart type
  if (chartType === "heikin-ashi") {
    const haData = toHeikinAshi(data).map((d: OHLCData) => ({
      ...d,
      time: castTime(d.time),
    }));
    series.setData(haData);
  } else if (chartType === "line" || chartType === "area") {
    // Line/Area need { time, value } format
    const lineData = data.map((d) => ({
      time: castTime(d.time),
      value: d.close,
    }));
    series.setData(lineData);
  } else {
    // Candlestick/OHLC use OHLC format directly
    const ohlcData = data.map((d) => ({
      time: castTime(d.time),
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));
    series.setData(ohlcData);
  }

  chart.timeScale().fitContent();

  return series;
}

/**
 * Add volume histogram series as an overlay on the main chart pane.
 *
 * Volume bars occupy the bottom 20% of the chart.
 * Each bar is colored green (bullish) or red (bearish) based on candle direction.
 */
export function addVolumeSeries(
  chart: IChartApi,
  data: OHLCVData[],
): ISeriesApi<SeriesType> {
  const volumeSeries = chart.addSeries(HistogramSeries, {
    priceFormat: { type: "volume" },
    priceScaleId: "", // Overlay -- separate from right price scale
  });

  // Position volume at bottom 20%
  volumeSeries.priceScale().applyOptions(VOLUME_PRICE_SCALE_OPTIONS);

  // Color each bar based on candle direction
  const volumeData = data.map((d) => ({
    time: castTime(d.time),
    value: d.volume,
    color:
      d.close >= d.open
        ? "rgba(38, 166, 154, 0.5)" // Green (bullish)
        : "rgba(239, 83, 80, 0.5)", // Red (bearish)
  }));

  volumeSeries.setData(volumeData);

  return volumeSeries;
}

/**
 * Switch the main series to a different chart type.
 *
 * Removes the old main series and creates a new one with the same data.
 * Volume series is NOT recreated (volume stays constant across chart types).
 */
export function switchSeries(
  chart: IChartApi,
  currentSeries: ISeriesApi<SeriesType> | null,
  chartType: ChartType,
  data: OHLCVData[],
): ISeriesApi<SeriesType> {
  if (currentSeries) {
    chart.removeSeries(currentSeries);
  }

  return addMainSeries(chart, chartType, data);
}

// ---------------------------------------------------------------------------
// Real-time update functions
// ---------------------------------------------------------------------------

/**
 * Update the current (last) candle on the chart in real-time.
 *
 * Uses series.update() which only modifies the last data point,
 * enabling smooth animation without full setData() rebuilds.
 */
export function updateCandle(
  mainSeries: ISeriesApi<SeriesType> | null,
  volumeSeries: ISeriesApi<SeriesType> | null,
  candle: OHLCVCandle,
  chartType: ChartType,
): void {
  if (!mainSeries || !volumeSeries) return;

  const time = castTime(candle.time);

  if (chartType === "line" || chartType === "area") {
    mainSeries.update({ time, value: candle.close });
  } else {
    mainSeries.update({
      time,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    });
  }

  volumeSeries.update({
    time,
    value: candle.volume,
    color:
      candle.close >= candle.open
        ? "rgba(38, 166, 154, 0.5)"
        : "rgba(239, 83, 80, 0.5)",
  });
}

// ---------------------------------------------------------------------------
// History prepending (infinite scroll)
// ---------------------------------------------------------------------------

/**
 * Format candle data for the main series based on chart type.
 */
function formatMainData(data: OHLCVData[], chartType: ChartType) {
  if (chartType === "heikin-ashi") {
    return toHeikinAshi(data).map((d: OHLCData) => ({
      ...d,
      time: castTime(d.time),
    }));
  } else if (chartType === "line" || chartType === "area") {
    return data.map((d) => ({
      time: castTime(d.time),
      value: d.close,
    }));
  } else {
    return data.map((d) => ({
      time: castTime(d.time),
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));
  }
}

/**
 * Format candle data for the volume series.
 */
function formatVolumeData(data: OHLCVData[]) {
  return data.map((d) => ({
    time: castTime(d.time),
    value: d.volume,
    color:
      d.close >= d.open
        ? "rgba(38, 166, 154, 0.5)"
        : "rgba(239, 83, 80, 0.5)",
  }));
}

/**
 * Prepend historical candles to existing chart data.
 *
 * Calls setData() on both series with the combined dataset.
 * Does NOT call fitContent() -- caller must save/restore visible range.
 *
 * Returns the combined data array for the caller to store.
 */
export function prependHistory(
  mainSeries: ISeriesApi<SeriesType> | null,
  volumeSeries: ISeriesApi<SeriesType> | null,
  existingData: OHLCVData[],
  newHistory: OHLCVData[],
  chartType: ChartType,
): OHLCVData[] {
  if (!mainSeries || !volumeSeries) return existingData;

  const combined = [...newHistory, ...existingData];

  mainSeries.setData(formatMainData(combined, chartType));
  volumeSeries.setData(formatVolumeData(combined));

  return combined;
}

// ---------------------------------------------------------------------------
// Skeleton candle generation and replacement
// ---------------------------------------------------------------------------

/**
 * Generate placeholder "skeleton" candles for loading indicators.
 *
 * Each skeleton candle has flat OHLC (= lastKnownPrice) and zero volume,
 * rendering as thin horizontal lines that are visually distinct from real candles.
 * The `_skeleton: true` flag allows identification and replacement later.
 *
 * @param count Number of skeleton candles to generate
 * @param endTime Time of the last skeleton candle (earliest = endTime - count * intervalSeconds)
 * @param intervalSeconds Seconds between candles for the current timeframe
 * @param lastKnownPrice Price value for the flat candles
 * @returns Array of skeleton candles sorted ascending by time
 */
export function generateSkeletonCandles(
  count: number,
  endTime: number,
  intervalSeconds: number,
  lastKnownPrice: number,
): SkeletonCandle[] {
  const skeletons: SkeletonCandle[] = [];

  for (let i = count - 1; i >= 0; i--) {
    skeletons.push({
      time: endTime - i * intervalSeconds,
      open: lastKnownPrice,
      high: lastKnownPrice,
      low: lastKnownPrice,
      close: lastKnownPrice,
      volume: 0,
      _skeleton: true,
    });
  }

  return skeletons;
}

/**
 * Replace skeleton candles with real historical data.
 *
 * Filters out skeleton candles from currentData, prepends realCandles,
 * and calls setData() on both series.
 *
 * Returns the updated data array for the caller to store.
 */
export function replaceSkeletonWithReal(
  mainSeries: ISeriesApi<SeriesType> | null,
  volumeSeries: ISeriesApi<SeriesType> | null,
  currentData: SkeletonCandle[],
  realCandles: OHLCVCandle[],
  chartType: ChartType,
): SkeletonCandle[] {
  if (!mainSeries || !volumeSeries) return currentData;

  // Remove skeleton candles
  const realOnly = currentData.filter((c) => !c._skeleton);

  // Prepend real historical candles
  const combined: SkeletonCandle[] = [...realCandles, ...realOnly];

  mainSeries.setData(formatMainData(combined, chartType));
  volumeSeries.setData(formatVolumeData(combined));

  return combined;
}
