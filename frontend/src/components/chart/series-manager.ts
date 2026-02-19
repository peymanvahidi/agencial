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
import { getSeriesOptions, VOLUME_PRICE_SCALE_OPTIONS } from "@/lib/chart-config";
import { toHeikinAshi } from "@/lib/heikin-ashi";

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
