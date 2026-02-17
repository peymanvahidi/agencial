"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { TopNav } from "@/components/layout/top-nav";
import { LeftSidebar } from "@/components/layout/left-sidebar";
import { RightSidebar } from "@/components/layout/right-sidebar";
import { useUIStore } from "@/stores/ui-store";

const LEFT_COLLAPSED_SIZE = 4;
const RIGHT_COLLAPSED_SIZE = 4;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const leftPanelRef = useRef<PanelImperativeHandle>(null);
  const rightPanelRef = useRef<PanelImperativeHandle>(null);

  const {
    leftSidebarCollapsed,
    rightSidebarCollapsed,
    setLeftSidebarCollapsed,
    setRightSidebarCollapsed,
  } = useUIStore();

  // Hydration guard: avoid SSR mismatch with persisted Zustand state
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Track collapse state via onResize callback (v4 API has no onCollapse/onExpand)
  const handleLeftResize = useCallback(
    (size: { asPercentage: number }) => {
      const collapsed = size.asPercentage <= LEFT_COLLAPSED_SIZE;
      setLeftSidebarCollapsed(collapsed);
    },
    [setLeftSidebarCollapsed],
  );

  const handleRightResize = useCallback(
    (size: { asPercentage: number }) => {
      const collapsed = size.asPercentage <= RIGHT_COLLAPSED_SIZE;
      setRightSidebarCollapsed(collapsed);
    },
    [setRightSidebarCollapsed],
  );

  // Programmatically collapse/expand panels when store state changes
  // (e.g., from sidebar toggle buttons)
  useEffect(() => {
    if (!hydrated) return;
    const leftPanel = leftPanelRef.current;
    if (leftPanel) {
      if (leftSidebarCollapsed && !leftPanel.isCollapsed()) {
        leftPanel.collapse();
      } else if (!leftSidebarCollapsed && leftPanel.isCollapsed()) {
        leftPanel.expand();
      }
    }
  }, [leftSidebarCollapsed, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const rightPanel = rightPanelRef.current;
    if (rightPanel) {
      if (rightSidebarCollapsed && !rightPanel.isCollapsed()) {
        rightPanel.collapse();
      } else if (!rightSidebarCollapsed && rightPanel.isCollapsed()) {
        rightPanel.expand();
      }
    }
  }, [rightSidebarCollapsed, hydrated]);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopNav />
      <ResizablePanelGroup orientation="horizontal" className="flex-1">
        {/* Left sidebar panel */}
        <ResizablePanel
          panelRef={leftPanelRef}
          id="left-sidebar"
          defaultSize={15}
          minSize={4}
          maxSize={25}
          collapsible
          collapsedSize={LEFT_COLLAPSED_SIZE}
          onResize={handleLeftResize}
        >
          <LeftSidebar />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Main content panel */}
        <ResizablePanel id="main-content" defaultSize={70} minSize={40}>
          <main className="h-full overflow-auto">{children}</main>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right sidebar panel */}
        <ResizablePanel
          panelRef={rightPanelRef}
          id="right-sidebar"
          defaultSize={15}
          minSize={4}
          maxSize={30}
          collapsible
          collapsedSize={RIGHT_COLLAPSED_SIZE}
          onResize={handleRightResize}
        >
          <RightSidebar />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
