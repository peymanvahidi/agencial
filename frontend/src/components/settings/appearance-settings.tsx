"use client";

import { useUserStore } from "@/stores/user-store";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const themes = [
  {
    id: "dark" as const,
    label: "Dark",
    icon: Moon,
    description: "Soft dark gray palette for reduced eye strain",
    previewBg: "#13131f",
    previewCard: "#1a1a2e",
    previewBorder: "#2a2a42",
    previewText: "#e2e8f0",
  },
  {
    id: "light" as const,
    label: "Light",
    icon: Sun,
    description: "Clean light theme for bright environments",
    previewBg: "#ffffff",
    previewCard: "#f8fafc",
    previewBorder: "#e2e8f0",
    previewText: "#0f172a",
  },
];

export function AppearanceSettings() {
  const { theme, setTheme } = useUserStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Appearance</h2>
        <p className="text-sm text-muted-foreground">
          Customize how Agencial looks on your device.
        </p>
      </div>

      <div className="space-y-4">
        <p className="text-sm font-medium">Theme</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {themes.map((t) => {
            const isSelected = theme === t.id;
            const Icon = t.icon;

            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  "group relative rounded-lg border-2 p-4 text-left transition-all",
                  isSelected
                    ? "border-brand bg-brand/5"
                    : "border-border hover:border-brand/50",
                )}
              >
                {/* Theme preview */}
                <div
                  className="mb-3 overflow-hidden rounded-md border"
                  style={{
                    backgroundColor: t.previewBg,
                    borderColor: t.previewBorder,
                  }}
                >
                  <div
                    className="flex items-center gap-2 border-b px-3 py-1.5"
                    style={{ borderColor: t.previewBorder }}
                  >
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: "oklch(0.75 0.15 195)" }}
                    />
                    <div
                      className="h-1.5 w-12 rounded"
                      style={{ backgroundColor: t.previewBorder }}
                    />
                  </div>
                  <div className="flex gap-2 p-3">
                    <div
                      className="h-8 w-8 rounded"
                      style={{ backgroundColor: t.previewCard }}
                    />
                    <div className="flex-1 space-y-1.5">
                      <div
                        className="h-1.5 w-3/4 rounded"
                        style={{ backgroundColor: t.previewBorder }}
                      />
                      <div
                        className="h-1.5 w-1/2 rounded"
                        style={{ backgroundColor: t.previewBorder }}
                      />
                    </div>
                  </div>
                </div>

                {/* Label */}
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{t.label}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.description}
                </p>

                {/* Selected indicator */}
                {isSelected && (
                  <div className="absolute right-3 top-3 h-2 w-2 rounded-full bg-brand" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
