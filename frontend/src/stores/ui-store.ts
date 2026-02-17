"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  leftSidebarCollapsed: boolean;
  rightSidebarCollapsed: boolean;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setLeftSidebarCollapsed: (collapsed: boolean) => void;
  setRightSidebarCollapsed: (collapsed: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      leftSidebarCollapsed: false,
      rightSidebarCollapsed: false,
      toggleLeftSidebar: () =>
        set((state) => ({
          leftSidebarCollapsed: !state.leftSidebarCollapsed,
        })),
      toggleRightSidebar: () =>
        set((state) => ({
          rightSidebarCollapsed: !state.rightSidebarCollapsed,
        })),
      setLeftSidebarCollapsed: (collapsed: boolean) =>
        set({ leftSidebarCollapsed: collapsed }),
      setRightSidebarCollapsed: (collapsed: boolean) =>
        set({ rightSidebarCollapsed: collapsed }),
    }),
    {
      name: "agencial-ui-state",
    },
  ),
);
