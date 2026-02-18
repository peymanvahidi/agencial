import NextAuth from "next-auth";
import authConfig from "../auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

/**
 * Route protection proxy using Auth.js v5.
 *
 * - Unauthenticated users are redirected to /login
 * - Authenticated users on /login are redirected to / (dashboard)
 * - Public routes: /login, /verify-email, /reset-password, /api/auth/*
 */
export const proxy = auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // Public auth pages
  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/verify-email") ||
    pathname.startsWith("/reset-password");

  // Auth.js API routes (must be accessible)
  const isApiAuth = pathname.startsWith("/api/auth");

  // Static files and Next.js internals
  const isPublicAsset =
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico";

  // Allow public routes
  if (isApiAuth || isPublicAsset) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login
  if (!isLoggedIn && !isAuthPage) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages to dashboard
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
