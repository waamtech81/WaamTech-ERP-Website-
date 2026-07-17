"use client";

import Link from "next/link";

/**
 * Legacy verify-email page — password decrypt + trial bypass path removed.
 * Users must complete OTP signup at /signup.
 */
export default function VerifyEmailPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold text-[#0b1f3a]">Verification link retired</h1>
      <p className="text-sm text-slate-600">
        Email-link verification is no longer used. Start a new signup and enter the one-time
        code sent to your email.
      </p>
      <Link
        href="/signup"
        className="rounded-md bg-[#0b1f3a] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        Go to signup
      </Link>
    </main>
  );
}
