"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("No verification token provided");
      return;
    }

    const verify = async () => {
      try {
        const backendUrl =
          process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

        const res = await fetch(`${backendUrl}/api/v1/auth/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.detail || "Verification failed");
        }

        setStatus("success");

        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } catch (err) {
        setStatus("error");
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Invalid or expired verification link",
        );
      }
    };

    verify();
  }, [token, router]);

  return (
    <div className="flex flex-col items-center text-center space-y-4">
      {status === "loading" && (
        <>
          <Loader2 className="h-12 w-12 animate-spin text-brand" />
          <h2 className="text-xl font-semibold text-foreground">
            Verifying your email...
          </h2>
          <p className="text-sm text-muted-foreground">
            Please wait while we verify your email address.
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <CheckCircle className="h-12 w-12 text-bullish" />
          <h2 className="text-xl font-semibold text-foreground">
            Email verified!
          </h2>
          <p className="text-sm text-muted-foreground">
            Your email has been verified. Redirecting to login...
          </p>
        </>
      )}

      {status === "error" && (
        <>
          <XCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-semibold text-foreground">
            Verification failed
          </h2>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
          <Button
            variant="outline"
            onClick={() => router.push("/login")}
            className="mt-4"
          >
            Back to login
          </Button>
        </>
      )}
    </div>
  );
}

/**
 * Email verification page.
 * Reads token from URL, calls backend to verify, shows result.
 * Wrapped in Suspense for useSearchParams compatibility.
 */
export default function VerifyEmailPage() {
  return (
    <AuthLayout>
      <Suspense
        fallback={
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
          </div>
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </AuthLayout>
  );
}
