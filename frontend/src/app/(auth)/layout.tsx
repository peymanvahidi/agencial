/**
 * Auth route group layout.
 * Does NOT include the dashboard shell -- auth pages have their own
 * full-page split-screen layout via auth-layout.tsx.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
