import {
  ColorType,
  CrosshairMode,
  LineStyle,
} from "lightweight-charts";
import type {
  ChartOptions,
  DeepPartial,
  CandlestickStyleOptions,
  BarStyleOptions,
  LineStyleOptions,
  AreaStyleOptions,
  HistogramStyleOptions,
  SeriesOptionsCommon,
} from "lightweight-charts";
import type { ChartType } from "@/types/chart";

// --- Chart Options (TradingView Dark Theme) ---

export const DEFAULT_CHART_OPTIONS: DeepPartial<ChartOptions> = {
  layout: {
    background: { type: ColorType.Solid, color: "#131722" },
    textColor: "#d1d4dc",
  },
  grid: {
    vertLines: { color: "rgba(42, 46, 57, 0.6)" },
    horzLines: { color: "rgba(42, 46, 57, 0.6)" },
  },
  crosshair: {
    mode: CrosshairMode.Normal,
    vertLine: {
      style: LineStyle.Dashed,
      color: "rgba(224, 227, 235, 0.4)",
      labelBackgroundColor: "#2a2e39",
    },
    horzLine: {
      style: LineStyle.Dashed,
      color: "rgba(224, 227, 235, 0.4)",
      labelBackgroundColor: "#2a2e39",
    },
  },
  rightPriceScale: {
    borderVisible: false,
    scaleMargins: {
      top: 0.1,
      bottom: 0.2,
    },
  },
  timeScale: {
    borderVisible: false,
    timeVisible: true,
    secondsVisible: false,
    rightOffset: 5,
    barSpacing: 8,
  },
  handleScroll: {
    mouseWheel: true,
    pressedMouseMove: true,
  },
  handleScale: {
    mouseWheel: true,
    pinch: true,
  },
};

// --- Series Options ---

export const CANDLESTICK_SERIES_OPTIONS: DeepPartial<
  CandlestickStyleOptions & SeriesOptionsCommon
> = {
  upColor: "#26a69a",
  downColor: "#ef5350",
  wickUpColor: "#26a69a",
  wickDownColor: "#ef5350",
  borderVisible: false,
};

export const BAR_SERIES_OPTIONS: DeepPartial<
  BarStyleOptions & SeriesOptionsCommon
> = {
  upColor: "#26a69a",
  downColor: "#ef5350",
};

export const LINE_SERIES_OPTIONS: DeepPartial<
  LineStyleOptions & SeriesOptionsCommon
> = {
  color: "#26a69a",
  lineWidth: 2,
};

export const AREA_SERIES_OPTIONS: DeepPartial<
  AreaStyleOptions & SeriesOptionsCommon
> = {
  topColor: "rgba(38, 166, 154, 0.4)",
  bottomColor: "rgba(38, 166, 154, 0.0)",
  lineColor: "#26a69a",
  lineWidth: 2,
};

export const VOLUME_SERIES_OPTIONS: DeepPartial<
  HistogramStyleOptions & SeriesOptionsCommon
> = {
  color: "rgba(38, 166, 154, 0.5)",
  priceFormat: {
    type: "volume",
  },
  priceScaleId: "",
};

export const VOLUME_PRICE_SCALE_OPTIONS = {
  scaleMargins: {
    top: 0.8,
    bottom: 0,
  },
};

/**
 * Get the appropriate series options for a given chart type.
 */
export function getSeriesOptions(
  chartType: ChartType,
): DeepPartial<SeriesOptionsCommon & Record<string, unknown>> {
  switch (chartType) {
    case "candlestick":
    case "heikin-ashi":
      return CANDLESTICK_SERIES_OPTIONS;
    case "ohlc":
      return BAR_SERIES_OPTIONS;
    case "line":
      return LINE_SERIES_OPTIONS;
    case "area":
      return AREA_SERIES_OPTIONS;
    default:
      return CANDLESTICK_SERIES_OPTIONS;
  }
}
