"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { User, Palette, BarChart3 } from "lucide-react";

export type SettingsCategory = "account" | "appearance" | "trading-defaults";

interface SettingsCategoryItem {
  id: SettingsCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const categories: SettingsCategoryItem[] = [
  { id: "account", label: "Account", icon: User },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "trading-defaults", label: "Trading Defaults", icon: BarChart3 },
];

interface SettingsLayoutProps {
  children: (activeCategory: SettingsCategory) => React.ReactNode;
}

export function SettingsLayout({ children }: SettingsLayoutProps) {
  const [activeCategory, setActiveCategory] =
    useState<SettingsCategory>("account");

  return (
    <div className="flex flex-col gap-6 p-6 md:flex-row">
      {/* Settings sidebar navigation */}
      <nav className="w-full shrink-0 md:w-56">
        <ul className="flex flex-row gap-1 md:flex-col">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;

            return (
              <li key={category.id}>
                <button
                  onClick={() => setActiveCategory(category.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-brand"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{category.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Settings content area */}
      <div className="flex-1 min-w-0">{children(activeCategory)}</div>
    </div>
  );
}
