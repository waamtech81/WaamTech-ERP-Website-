import Link from "next/link";
import type { ReactNode } from "react";
import { Apple, Play } from "lucide-react";
import {
  getAppStoreUrl,
  getGooglePlayUrl,
  isExternalStoreUrl,
} from "@/lib/app-stores";
import { cn } from "@/lib/utils";

const badgeClassLight =
  "inline-flex h-[52px] min-w-[11rem] items-center gap-3 rounded-xl border border-[#1e3a5f] bg-[#0b1f3a] px-3.5 text-white shadow-sm transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const badgeClassDark =
  "inline-flex h-[52px] min-w-[11rem] items-center gap-3 rounded-xl border border-white/[0.08] bg-[#0b1f3a] px-3.5 text-white shadow-sm transition-colors hover:border-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/20";

function StoreBadge({
  href,
  external,
  title,
  subtitle,
  icon,
  dark,
}: {
  href: string;
  external: boolean;
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
        <span className="block text-[9px] font-medium uppercase tracking-[0.05em] text-white/70">
          {subtitle}
        </span>
        <span className="block truncate text-[15px] font-semibold">{title}</span>
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
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={badgeClass}>
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
          subtitle="Get it on"
          title="Google Play"
          icon={<Play className="h-5 w-5 fill-current" strokeWidth={1.5} aria-hidden />}
          dark={dark}
        />
        <StoreBadge
          href={appStoreUrl}
          external={isExternalStoreUrl(appStoreUrl)}
          subtitle="Download on the"
          title="App Store"
          icon={<Apple className="h-5 w-5" aria-hidden />}
          dark={dark}
        />
      </div>
    </div>
  );
}
