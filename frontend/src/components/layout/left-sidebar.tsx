"use client";

import { useUIStore } from "@/stores/ui-store";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: BarChart3, label: "Chart", href: "#", disabled: true },
  { icon: BookOpen, label: "Journal", href: "#", disabled: true },
  { icon: TrendingUp, label: "Analytics", href: "#", disabled: true },
];

export function LeftSidebar() {
  const { leftSidebarCollapsed, toggleLeftSidebar } = useUIStore();
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Navigation items */}
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.disabled ? "#" : item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200",
                isActive
                  ? "bg-sidebar-accent text-brand"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                item.disabled && "pointer-events-none opacity-50",
                leftSidebarCollapsed && "justify-center px-2",
              )}
              title={leftSidebarCollapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!leftSidebarCollapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-border p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLeftSidebar}
          className={cn(
            "w-full justify-center",
            !leftSidebarCollapsed && "justify-end",
          )}
          title={leftSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {leftSidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
