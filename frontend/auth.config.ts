import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

/**
 * Edge-compatible auth configuration.
 * This file is imported by middleware.ts which runs on the Edge runtime.
 * Do NOT import any Node.js-only modules (database drivers, etc.) here.
 */
export default {
  providers: [
    Google,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const backendUrl =
          process.env.BACKEND_URL || "http://localhost:8000";

        try {
          const res = await fetch(`${backendUrl}/api/v1/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!res.ok) {
            const error = await res.json().catch(() => null);
            const detail = error?.detail || "Invalid credentials";
            throw new Error(detail);
          }

          const user = await res.json();
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          if (error instanceof Error) {
            throw error;
          }
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig;
