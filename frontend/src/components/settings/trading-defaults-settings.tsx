"use client";

import { useUserStore } from "@/stores/user-store";
import { Label } from "@/components/ui/label";

const timeframes = [
  { value: "1m", label: "1 Minute" },
  { value: "5m", label: "5 Minutes" },
  { value: "15m", label: "15 Minutes" },
  { value: "30m", label: "30 Minutes" },
  { value: "1H", label: "1 Hour" },
  { value: "4H", label: "4 Hours" },
  { value: "D", label: "Daily" },
  { value: "W", label: "Weekly" },
  { value: "M", label: "Monthly" },
];

const timezones = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time (New York)" },
  { value: "America/Chicago", label: "Central Time (Chicago)" },
  { value: "America/Denver", label: "Mountain Time (Denver)" },
  { value: "America/Los_Angeles", label: "Pacific Time (Los Angeles)" },
  { value: "America/Toronto", label: "Eastern Time (Toronto)" },
  { value: "America/Sao_Paulo", label: "Brasilia Time (Sao Paulo)" },
  { value: "Europe/London", label: "Greenwich Mean Time (London)" },
  { value: "Europe/Berlin", label: "Central European Time (Berlin)" },
  { value: "Europe/Paris", label: "Central European Time (Paris)" },
  { value: "Europe/Moscow", label: "Moscow Time" },
  { value: "Europe/Istanbul", label: "Turkey Time (Istanbul)" },
  { value: "Asia/Dubai", label: "Gulf Standard Time (Dubai)" },
  { value: "Asia/Kolkata", label: "India Standard Time (Kolkata)" },
  { value: "Asia/Singapore", label: "Singapore Time" },
  { value: "Asia/Shanghai", label: "China Standard Time (Shanghai)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (Tokyo)" },
  { value: "Asia/Seoul", label: "Korea Standard Time (Seoul)" },
  { value: "Asia/Hong_Kong", label: "Hong Kong Time" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (Sydney)" },
  { value: "Pacific/Auckland", label: "New Zealand Time (Auckland)" },
];

export function TradingDefaultsSettings() {
  const { defaultTimeframe, timezone, updatePreference } = useUserStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Trading Defaults</h2>
        <p className="text-sm text-muted-foreground">
          Set your default chart timeframe and timezone. These will be applied
          when you open new charts.
        </p>
      </div>

      <div className="space-y-6 rounded-lg border border-border bg-card p-6">
        {/* Default Timeframe */}
        <div className="space-y-2">
          <Label htmlFor="timeframe">Default Timeframe</Label>
          <select
            id="timeframe"
            value={defaultTimeframe}
            onChange={(e) =>
              updatePreference("defaultTimeframe", e.target.value)
            }
            className="flex h-9 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {timeframes.map((tf) => (
              <option key={tf.value} value={tf.value}>
                {tf.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            The default chart timeframe when opening new charts.
          </p>
        </div>

        {/* Timezone */}
        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <select
            id="timezone"
            value={timezone}
            onChange={(e) => updatePreference("timezone", e.target.value)}
            className="flex h-9 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {timezones.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Times and dates will be displayed in this timezone.
          </p>
        </div>
      </div>
    </div>
  );
}
