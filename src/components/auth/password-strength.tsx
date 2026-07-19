"use client";

import { Check } from "lucide-react";
import {
  evaluatePasswordStrength,
  PASSWORD_STRENGTH_RULES,
  isPasswordStrong,
  type PasswordStrengthRule,
} from "@/lib/auth/password-rules";
import { cn } from "@/lib/utils";

export {
  PASSWORD_STRENGTH_RULES,
  evaluatePasswordStrength,
  isPasswordStrong,
  type PasswordStrengthRule,
};

/** Same checklist UI used on signup / reset — for portal settings. */
export function PasswordStrengthIndicator({
  password,
  className,
  variant = "default",
}: {
  password: string;
  className?: string;
  variant?: "default" | "portal";
}) {
  const { checks, strong } = evaluatePasswordStrength(password);
  if (!password) return null;

  const isPortal = variant === "portal";

  return (
    <div
      className={cn(
        "rounded-xl border p-3",
        strong
          ? isPortal
            ? "border-emerald-500/30 bg-emerald-500/10"
            : "border-emerald-200 bg-emerald-50"
          : isPortal
            ? "border-[var(--portal-border)] bg-[var(--portal-soft)]"
            : "border-border bg-slate-50",
        className
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p
          className={cn(
            "text-sm font-medium",
            strong
              ? isPortal
                ? "text-emerald-800 dark:text-emerald-200"
                : "text-emerald-700"
              : isPortal
                ? "text-[var(--portal-fg)]"
                : "text-[#0b1f3a]"
          )}
        >
          {strong ? "Password looks strong" : "Password must include"}
        </p>
        {strong ? (
          <Check
            className={cn(
              "h-4 w-4",
              isPortal ? "text-emerald-700 dark:text-emerald-300" : "text-emerald-600"
            )}
          />
        ) : null}
      </div>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {checks.map((r) => (
          <li
            key={r.id}
            className={cn(
              "flex items-center gap-2 text-xs",
              r.ok
                ? isPortal
                  ? "text-emerald-800 dark:text-emerald-200"
                  : "text-emerald-700"
                : isPortal
                  ? "text-[var(--portal-muted)]"
                  : "text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "flex h-4 w-4 items-center justify-center rounded-full border",
                r.ok
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : isPortal
                    ? "border-[var(--portal-border)] bg-[var(--portal-panel)]"
                    : "border-slate-300 bg-white"
              )}
            >
              {r.ok ? <Check className="h-2.5 w-2.5" /> : null}
            </span>
            {r.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
