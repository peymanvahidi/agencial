"use client";

import { useUIStore } from "@/stores/ui-store";
import { Bot, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RightSidebar() {
  const { rightSidebarCollapsed, toggleRightSidebar } = useUIStore();

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Content */}
      <div className="flex-1 p-3">
        <div
          className={cn(
            "flex items-center gap-3",
            rightSidebarCollapsed && "justify-center",
          )}
        >
          <Bot className="h-5 w-5 shrink-0 text-brand" />
          {!rightSidebarCollapsed && (
            <div>
              <h3 className="text-sm font-semibold">AI Co-Pilot</h3>
              <p className="text-xs text-muted-foreground">Coming soon</p>
            </div>
          )}
        </div>

        {!rightSidebarCollapsed && (
          <div className="mt-6 rounded-lg border border-border bg-background/50 p-4 text-center">
            <Bot className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-2 text-xs text-muted-foreground">
              Your personalized trading assistant will appear here. It learns
              from your backtests and helps refine your strategy.
            </p>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <div className="border-t border-border p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleRightSidebar}
          className={cn(
            "w-full justify-center",
            !rightSidebarCollapsed && "justify-start",
          )}
          title={rightSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {rightSidebarCollapsed ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
