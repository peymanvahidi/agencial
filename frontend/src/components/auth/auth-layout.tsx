import { BarChart3, Bot, TrendingUp } from "lucide-react";

/**
 * Split-screen auth layout.
 * Left: dark gradient branding panel with logo and tagline.
 * Right: centered form area.
 * On mobile: left panel is hidden, form takes full width.
 */
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Left branding panel -- hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-[#0d0d1a] via-[#13131f] to-[#1a1a2e] p-12 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-brand blur-[128px]" />
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-brand blur-[160px]" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-brand">Agencial</h1>
        </div>

        {/* Tagline and features */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground leading-tight">
              AI-powered
              <br />
              trading platform
            </h2>
            <p className="mt-3 text-muted-foreground text-lg max-w-md">
              Backtest strategies, learn from your trades, and let AI become
              your personalized co-pilot.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10">
                <BarChart3 className="h-5 w-5 text-brand" />
              </div>
              <span className="text-sm">Advanced backtesting engine</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10">
                <Bot className="h-5 w-5 text-brand" />
              </div>
              <span className="text-sm">AI co-pilot that learns your style</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10">
                <TrendingUp className="h-5 w-5 text-brand" />
              </div>
              <span className="text-sm">
                Performance analytics and insights
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-xs text-muted-foreground/60">
            &copy; {new Date().getFullYear()} Agencial. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-8 md:p-12 bg-background">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
