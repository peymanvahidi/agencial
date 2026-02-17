"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

/**
 * Wraps next-auth/react SessionProvider for use in the root layout.
 * This enables useSession() hook in client components.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
