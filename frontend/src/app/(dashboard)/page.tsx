"use client";

import { useSession } from "@/hooks/use-session";
import { Loader2, BarChart3, FlaskConical, Bot } from "lucide-react";

const upcomingFeatures = [
  {
    icon: BarChart3,
    title: "Charts & Indicators",
    description: "TradingView-powered charts with custom indicator overlays",
  },
  {
    icon: FlaskConical,
    title: "Backtesting",
    description: "Test your strategies against historical data with detailed analytics",
  },
  {
    icon: Bot,
    title: "AI Co-Pilot",
    description: "A personalized assistant that learns your trading style",
  },
];

export default function DashboardHome() {
  const { user, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  const displayName = user?.name || "there";

  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="w-full max-w-2xl space-y-8 text-center">
        {/* Welcome heading */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome to{" "}
            <span className="text-brand">Agencial</span>
            {user?.name ? `, ${user.name}` : ""}
          </h1>
          <p className="text-lg text-muted-foreground">
            Your AI-powered trading co-pilot
          </p>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground">
          Start by exploring the platform. Charts, indicators, and backtesting
          tools are coming soon.
        </p>

        {/* Upcoming features cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {upcomingFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-brand/30"
              >
                <Icon className="mb-3 h-6 w-6 text-brand" />
                <h3 className="text-sm font-semibold">{feature.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
