"use client";

import {
  ChartCandlestick,
  ChartBar,
  ChartLine,
  ChartArea,
  ChevronDown,
  Star,
  Check,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useChartStore } from "@/stores/chart-store";
import { TIMEFRAMES, type ChartType, type Timeframe } from "@/types/chart";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Chart type icon / label mappings
// ---------------------------------------------------------------------------

const CHART_TYPE_META: Record<
  ChartType,
  { label: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  candlestick: { label: "Candlestick", Icon: ChartCandlestick },
  "heikin-ashi": { label: "Heikin-Ashi", Icon: ChartCandlestick },
  ohlc: { label: "OHLC Bar", Icon: ChartBar },
  line: { label: "Line", Icon: ChartLine },
  area: { label: "Area", Icon: ChartArea },
};

const CHART_TYPES = Object.keys(CHART_TYPE_META) as ChartType[];

// ---------------------------------------------------------------------------
// ChartToolbar
// ---------------------------------------------------------------------------

export function ChartToolbar() {
  const activeSymbol = useChartStore((s) => s.activeSymbol);
  const activeTimeframe = useChartStore((s) => s.activeTimeframe);
  const favoriteTimeframes = useChartStore((s) => s.favoriteTimeframes);
  const setTimeframe = useChartStore((s) => s.setTimeframe);
  const toggleFavoriteTimeframe = useChartStore(
    (s) => s.toggleFavoriteTimeframe,
  );
  const chartType = useChartStore((s) => s.chartType);
  const setChartType = useChartStore((s) => s.setChartType);
  const scaleMode = useChartStore((s) => s.scaleMode);
  const toggleScaleMode = useChartStore((s) => s.toggleScaleMode);

  const { Icon: ActiveChartIcon } = CHART_TYPE_META[chartType];

  return (
    <div
      className="flex h-9 shrink-0 items-center gap-1 border-b px-2"
      style={{
        backgroundColor: "#1e222d",
        borderColor: "#2a2e39",
      }}
    >
      {/* ----- Symbol display (far left) ----- */}
      <span className="mr-2 text-xs font-bold text-white">{activeSymbol}</span>

      {/* ----- Separator ----- */}
      <div className="mx-1 h-4 w-px" style={{ backgroundColor: "#2a2e39" }} />

      {/* ----- Favorite timeframe buttons (sorted low → high) ----- */}
      {[...favoriteTimeframes]
        .sort(
          (a, b) =>
            TIMEFRAMES.findIndex((t) => t.value === a) -
            TIMEFRAMES.findIndex((t) => t.value === b),
        )
        .map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={cn(
              "h-7 rounded px-2 text-xs font-medium transition-colors",
              activeTimeframe === tf
                ? "bg-brand/20 text-brand"
                : "text-white/60 hover:bg-white/5 hover:text-white/90",
            )}
          >
            {tf}
          </button>
        ))}

      {/* ----- Timeframe dropdown (all timeframes) ----- */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex h-7 items-center gap-0.5 rounded px-1.5 text-white/60 transition-colors hover:bg-white/5 hover:text-white/90">
            <ChevronDown className="size-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="min-w-[160px]"
          style={{ backgroundColor: "#1e222d", borderColor: "#2a2e39" }}
        >
          {TIMEFRAMES.map((tf) => {
            const isFav = favoriteTimeframes.includes(tf.value);
            const isActive = activeTimeframe === tf.value;
            return (
              <DropdownMenuItem
                key={tf.value}
                onClick={() => setTimeframe(tf.value)}
                className="flex items-center justify-between gap-3"
              >
                <span className="flex items-center gap-2">
                  {isActive && <Check className="size-3.5 text-brand" />}
                  <span className={isActive ? "text-brand font-medium" : ""}>
                    {tf.label}
                  </span>
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavoriteTimeframe(tf.value);
                  }}
                  className="rounded p-0.5 hover:bg-white/10"
                  title={isFav ? "Remove from favorites" : "Add to favorites"}
                >
                  <Star
                    className={cn(
                      "size-3",
                      isFav
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-white/30",
                    )}
                  />
                </button>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ----- Separator ----- */}
      <div className="mx-1 h-4 w-px" style={{ backgroundColor: "#2a2e39" }} />

      {/* ----- Chart type dropdown ----- */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex h-7 items-center gap-1 rounded px-1.5 text-white/60 transition-colors hover:bg-white/5 hover:text-white/90">
            <ActiveChartIcon className="size-4" />
            <ChevronDown className="size-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="min-w-[160px]"
          style={{ backgroundColor: "#1e222d", borderColor: "#2a2e39" }}
        >
          {CHART_TYPES.map((ct) => {
            const { label, Icon } = CHART_TYPE_META[ct];
            const isActive = chartType === ct;
            return (
              <DropdownMenuItem
                key={ct}
                onClick={() => setChartType(ct)}
                className="flex items-center gap-2"
              >
                {isActive ? (
                  <Check className="size-3.5 text-brand" />
                ) : (
                  <Icon className="size-3.5" />
                )}
                <span className={isActive ? "text-brand font-medium" : ""}>
                  {label}
                </span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ----- Separator ----- */}
      <div className="mx-1 h-4 w-px" style={{ backgroundColor: "#2a2e39" }} />

      {/* ----- Scale toggle (Lin / Log) ----- */}
      <button
        onClick={toggleScaleMode}
        className={cn(
          "h-7 rounded px-2 text-xs font-medium transition-colors",
          scaleMode === "logarithmic"
            ? "bg-brand/20 text-brand"
            : "text-white/60 hover:bg-white/5 hover:text-white/90",
        )}
        title={
          scaleMode === "logarithmic"
            ? "Switch to linear scale"
            : "Switch to logarithmic scale"
        }
      >
        {scaleMode === "logarithmic" ? "Log" : "Lin"}
      </button>
    </div>
  );
}
