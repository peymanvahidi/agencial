"use client";

import { create } from "zustand";

interface UserPreferences {
  theme: string;
  defaultTimeframe: string;
  timezone: string;
}

interface UserStore {
  // State
  theme: string;
  defaultTimeframe: string;
  timezone: string;
  isLoaded: boolean;

  // Actions
  fetchPreferences: () => Promise<void>;
  updatePreference: (
    key: keyof UserPreferences,
    value: string,
  ) => Promise<void>;
  setTheme: (theme: string) => Promise<void>;
  reset: () => void;
}

export const useUserStore = create<UserStore>()((set, get) => ({
  theme: "dark",
  defaultTimeframe: "4H",
  timezone: "UTC",
  isLoaded: false,

  fetchPreferences: async () => {
    try {
      const res = await fetch("/api/v1/users/me/preferences", {
        credentials: "include",
      });
      if (!res.ok) {
        // Non-critical: use defaults
        set({ isLoaded: true });
        return;
      }
      const data = await res.json();
      set({
        theme: data.theme || "dark",
        defaultTimeframe: data.default_timeframe || "4H",
        timezone: data.timezone || "UTC",
        isLoaded: true,
      });

      // Sync theme with next-themes
      if (typeof window !== "undefined") {
        const { useTheme } = await import("next-themes");
        // We can't call hooks here, so directly set the theme via document class
        applyTheme(data.theme || "dark");
      }
    } catch {
      // Network error: use defaults
      set({ isLoaded: true });
    }
  },

  updatePreference: async (key, value) => {
    // Optimistic update
    set({ [key]: value });

    // Map frontend key names to backend field names
    const fieldMap: Record<keyof UserPreferences, string> = {
      theme: "theme",
      defaultTimeframe: "default_timeframe",
      timezone: "timezone",
    };

    try {
      await fetch("/api/v1/users/me/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ [fieldMap[key]]: value }),
      });
    } catch {
      // Silently fail -- preference persisted locally at minimum
    }
  },

  setTheme: async (theme: string) => {
    set({ theme });
    applyTheme(theme);

    try {
      await fetch("/api/v1/users/me/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ theme }),
      });
    } catch {
      // Silently fail
    }
  },

  reset: () => {
    set({
      theme: "dark",
      defaultTimeframe: "4H",
      timezone: "UTC",
      isLoaded: false,
    });
  },
}));

/**
 * Apply theme by dispatching to next-themes via document class manipulation.
 * This works because next-themes watches for class changes on the html element.
 */
function applyTheme(theme: string) {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  // Also update localStorage for next-themes compatibility
  try {
    localStorage.setItem("theme", theme);
  } catch {
    // Ignore storage errors
  }
}
