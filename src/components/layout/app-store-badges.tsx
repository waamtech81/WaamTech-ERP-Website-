import Link from "next/link";
import type { ReactNode } from "react";
import {
  getAppStoreUrl,
  getGooglePlayUrl,
  isExternalStoreUrl,
} from "@/lib/app-stores";
import { cn } from "@/lib/utils";

function GooglePlayIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="currentColor"
    >
      <path d="M3.6 1.8c-.3.2-.6.6-.6 1.1v18.2c0 .5.3.9.6 1.1l.1.1 10.2-10.2v-.2L3.7 1.7l-.1.1z" />
      <path d="M16.2 8.3 5.5 1.9l10.2 10.2 2.1-2.1c.6-.6.6-1.5 0-2.1l-1.6-1.6z" />
      <path d="m5.5 22.1 10.7-6.4-2.1-2.1-8.6 8.5z" />
      <path d="M19.9 11.8c.5-.3.8-.8.8-1.3s-.3-1-.8-1.3l-2.1-1.2-2.4 2.4 2.4 2.4 2.1-1.2z" />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M16.7 13.1c-.1-2.5 2-3.7 2.1-3.8-1.1-1.7-2.9-1.9-3.5-2-1.5-.2-2.9.9-3.7.9-.8 0-2-.9-3.3-.8-1.7 0-3.2 1-4.1 2.5-1.7 3-.5 7.5 1.2 9.9.8 1.2 1.8 2.5 3.1 2.5 1.2 0 1.7-.8 3.2-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.1-1.2 2.9-2.4.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.5-1-2.5-3.9zM14.5 4.2c.7-.9 1.2-2.1 1.1-3.3-1.1 0-2.4.7-3.1 1.6-.6.8-1.2 2-1 3.2 1.2.1 2.4-.6 3-1.5z" />
    </svg>
  );
}

const badgeClassLight =
  "inline-flex h-12 min-w-[10.5rem] items-center gap-3 rounded-xl border border-border bg-[#0b1f3a] px-3.5 text-white shadow-sm transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const badgeClassDark =
  "inline-flex h-12 min-w-[10.5rem] items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.05] px-3.5 text-white shadow-sm transition-colors hover:border-white/10 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/20";

function StoreBadge({
  href,
  external,
  label,
  title,
  subtitle,
  icon,
  dark,
}: {
  href: string;
  external: boolean;
  label: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  dark?: boolean;
}) {
  const badgeClass = dark ? badgeClassDark : badgeClassLight;
  const content = (
    <>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
        {icon}
      </span>
      <span className="min-w-0 text-left leading-tight">
        <span className="block text-[10px] font-medium uppercase tracking-wide text-white/70">
          {subtitle}
        </span>
        <span className="block truncate text-sm font-semibold">{title}</span>
      </span>
    </>
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={badgeClass}
        aria-label={label}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={badgeClass} aria-label={label}>
      {content}
    </Link>
  );
}

export function AppStoreBadges({
  className,
  variant = "light",
}: {
  className?: string;
  variant?: "light" | "dark";
}) {
  const googlePlayUrl = getGooglePlayUrl();
  const appStoreUrl = getAppStoreUrl();
  const dark = variant === "dark";

  return (
    <div className={cn("space-y-2", className)}>
      <p className={cn("text-sm font-medium", dark ? "text-white" : undefined)}>
        Get the mobile app
      </p>
      <div className="flex flex-wrap gap-2.5">
        <StoreBadge
          href={googlePlayUrl}
          external={isExternalStoreUrl(googlePlayUrl)}
          label="Get WAAMTO on Google Play"
          subtitle="Get it on"
          title="Google Play"
          icon={<GooglePlayIcon className="h-5 w-5" />}
          dark={dark}
        />
        <StoreBadge
          href={appStoreUrl}
          external={isExternalStoreUrl(appStoreUrl)}
          label="Download WAAMTO on the App Store"
          subtitle="Download on the"
          title="App Store"
          icon={<AppleIcon className="h-5 w-5" />}
          dark={dark}
        />
      </div>
    </div>
  );
}
