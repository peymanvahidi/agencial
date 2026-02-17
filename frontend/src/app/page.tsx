"use client";

import { useSession } from "@/hooks/use-session";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

/**
 * Dashboard home page (protected by middleware).
 * Shows a welcome message with the user's name.
 * Will be replaced by the full dashboard shell in Plan 03.
 */
export default function DashboardHome() {
  const { user, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-brand">
          Welcome to Agencial
        </h1>
        {user?.name && (
          <p className="text-lg text-foreground">
            Hello, {user.name}
          </p>
        )}
        <p className="text-muted-foreground">
          Your AI-powered trading co-pilot is ready.
        </p>
        <Button
          variant="outline"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-4"
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
