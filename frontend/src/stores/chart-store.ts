"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChartType, Timeframe, ScaleMode } from "@/types/chart";
import {
  DEFAULT_SYMBOL,
  DEFAULT_TIMEFRAME,
  DEFAULT_CHART_TYPE,
} from "@/types/chart";

interface ChartState {
  // State
  activeSymbol: string;
  activeTimeframe: Timeframe;
  chartType: ChartType;
  scaleMode: ScaleMode;
  favoriteTimeframes: Timeframe[];

  // Actions
  setSymbol: (symbol: string) => void;
  setTimeframe: (timeframe: Timeframe) => void;
  setChartType: (chartType: ChartType) => void;
  toggleScaleMode: () => void;
  toggleFavoriteTimeframe: (tf: Timeframe) => void;
}

export const useChartStore = create<ChartState>()(
  persist(
    (set) => ({
      activeSymbol: DEFAULT_SYMBOL.symbol,
      activeTimeframe: DEFAULT_TIMEFRAME,
      chartType: DEFAULT_CHART_TYPE,
      scaleMode: "linear" as ScaleMode,
      favoriteTimeframes: ["1H", "4H", "1D"] as Timeframe[],

      setSymbol: (symbol: string) => set({ activeSymbol: symbol }),

      setTimeframe: (timeframe: Timeframe) =>
        set({ activeTimeframe: timeframe }),

      setChartType: (chartType: ChartType) => set({ chartType }),

      toggleScaleMode: () =>
        set((state) => ({
          scaleMode:
            state.scaleMode === "linear" ? "logarithmic" : "linear",
        })),

      toggleFavoriteTimeframe: (tf: Timeframe) =>
        set((state) => {
          const favorites = state.favoriteTimeframes;
          if (favorites.includes(tf)) {
            return {
              favoriteTimeframes: favorites.filter((f) => f !== tf),
            };
          }
          return {
            favoriteTimeframes: [...favorites, tf],
          };
        }),
    }),
    {
      name: "chart-store",
    },
  ),
);
