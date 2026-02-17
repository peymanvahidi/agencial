import NextAuth from "next-auth";
import authConfig from "../auth.config";

/**
 * Full Auth.js v5 configuration with callbacks.
 * This file runs in the Node.js runtime (not Edge).
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, account }) {
      // On initial sign-in, add userId to token
      if (user) {
        token.userId = user.id;
      }

      // For OAuth sign-in, sync user to backend via oauth-callback
      if (account && account.provider !== "credentials" && user) {
        const backendUrl =
          process.env.BACKEND_URL || "http://localhost:8000";
        try {
          const res = await fetch(
            `${backendUrl}/api/v1/auth/oauth-callback`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: user.email,
                name: user.name,
                image: user.image,
                provider: account.provider,
                provider_account_id: account.providerAccountId,
              }),
            },
          );
          if (res.ok) {
            const backendUser = await res.json();
            // Use the backend user ID (UUID) instead of the OAuth provider ID
            token.userId = backendUser.id;
          }
        } catch (error) {
          console.error("Failed to sync OAuth user to backend:", error);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
});
