import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/data/site";

/** Public root asset: /waamto-logo.webp */
export const LOGO_SRC = "/waamto-logo.webp";
export const LOGO_WIDTH = 512;
export const LOGO_HEIGHT = 204;

type BrandLogoProps = {
  withWordmark?: boolean;
  hideTagline?: boolean;
  tone?: "light" | "dark";
  className?: string;
  height?: number;
  priority?: boolean;
  href?: string | null;
};

export function BrandLogo({
  withWordmark = true,
  hideTagline = false,
  tone = "light",
  className,
  height = 36,
  priority = false,
  href = "/",
}: BrandLogoProps) {
  const width = Math.round((height * LOGO_WIDTH) / LOGO_HEIGHT);
  const dark = tone === "dark";

  const mark = (
    <span className={cn("inline-flex items-center gap-2.5 shrink-0", className)}>
      <Image
        src={LOGO_SRC}
        alt={siteConfig.name}
        width={width}
        height={height}
        priority={priority}
        quality={70}
        className="h-auto w-auto object-contain"
        style={{ height, width: "auto" }}
      />
      {withWordmark ? (
        <span className="flex flex-col leading-none" translate="no">
          <span
            className={cn(
              "font-heading text-lg font-semibold tracking-tight",
              dark ? "text-white" : "text-[var(--brand-dark)]"
            )}
          >
            {siteConfig.name}
          </span>
          {!hideTagline ? (
            <span
              className={cn(
                "mt-0.5 hidden text-[10px] font-medium sm:block",
                dark ? "text-slate-400" : "text-primary/70"
              )}
            >
              {siteConfig.productLine}
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );

  if (href === null) return mark;

  return (
    <Link href={href} className="inline-flex shrink-0 group" aria-label={siteConfig.name}>
      {mark}
    </Link>
  );
}
