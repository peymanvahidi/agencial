"use client";

import { useSession as useNextAuthSession } from "next-auth/react";

/**
 * Typed wrapper around next-auth/react useSession.
 * Provides convenient properties for checking auth state.
 */
export function useSession() {
  const { data: session, status } = useNextAuthSession();

  return {
    session,
    user: session?.user ?? null,
    status,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
  };
}
