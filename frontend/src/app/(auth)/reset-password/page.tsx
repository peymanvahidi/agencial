"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, XCircle } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  if (!token) {
    return (
      <div className="flex flex-col items-center text-center space-y-4">
        <XCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-semibold text-foreground">
          Invalid reset link
        </h2>
        <p className="text-sm text-muted-foreground">
          This password reset link is invalid or has expired.
        </p>
        <Button variant="outline" asChild className="mt-4">
          <Link href="/login">Back to login</Link>
        </Button>
      </div>
    );
  }

  return <ResetPasswordForm token={token} />;
}

/**
 * Reset password page.
 * Reads token from URL, shows new password form.
 * Wrapped in Suspense for useSearchParams compatibility.
 */
export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <Suspense
        fallback={
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
          </div>
        }
      >
        <ResetPasswordContent />
      </Suspense>
    </AuthLayout>
  );
}
