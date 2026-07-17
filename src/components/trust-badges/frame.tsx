import type { ReactNode, SVGProps } from "react";
import { cn } from "@/lib/utils";

export type TrustMarkProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

const STROKE = 1.5;

/**
 * Icon seal only — label is rendered as HTML under the badge for crisp readability.
 */
export function TrustSealFrame({
  label,
  children,
  className,
  title,
  ...props
}: TrustMarkProps & { label: string; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title ?? label}
      className={cn("wt-trust-svg", className)}
      {...props}
    >
      <title>{title ?? label}</title>
      <rect
        x="3"
        y="3"
        width="90"
        height="90"
        rx="18"
        ry="18"
        className="wt-trust-fill"
        stroke="currentColor"
        strokeWidth={STROKE}
      />
      <rect
        x="12"
        y="12"
        width="72"
        height="72"
        rx="14"
        ry="14"
        className="wt-trust-inner"
        stroke="currentColor"
        strokeWidth={1}
        strokeOpacity={0.35}
      />
      <g
        transform="translate(48 48)"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </g>
    </svg>
  );
}
