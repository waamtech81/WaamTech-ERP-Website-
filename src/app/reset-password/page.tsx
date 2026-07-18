"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

/**
 * Legacy alias — canonical URL is /forgot-password?token=…
 * Keeps old emailed /reset-password?token= links working.
 */
function ResetPasswordAlias() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = (searchParams.get("token") || "").trim();

  useEffect(() => {
    if (token && token.length >= 20) {
      router.replace(`/forgot-password?token=${encodeURIComponent(token)}`);
    }
  }, [token, router]);

  if (token && token.length >= 20) {
    // Brief render while redirecting; also usable if replace is slow
    return <ResetPasswordForm token={token} />;
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-muted">
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      <div className="container-site relative flex justify-center py-20">
        <Card className="w-full max-w-md shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
          <CardHeader>
            <CardTitle>Invalid reset link</CardTitle>
            <CardDescription>
              This page needs a secure token from your password reset email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full rounded-full">
              <Link href="/forgot-password">Request reset link</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
          Loading...
        </div>
      }
    >
      <ResetPasswordAlias />
    </Suspense>
  );
}
