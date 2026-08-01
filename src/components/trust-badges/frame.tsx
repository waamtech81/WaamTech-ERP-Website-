import type { ReactNode, SVGProps } from "react";
import { cn } from "@/lib/utils";

export type TrustMarkProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

const STROKE = 1.5;

/**
 * Icon seal only — label is rendered as HTML under the badge for crisp readability.
 * Single soft plate (no nested border boxes).
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
        x="6"
        y="6"
        width="84"
        height="84"
        rx="22"
        ry="22"
        className="wt-trust-fill"
      />
      <rect
        x="6"
        y="6"
        width="84"
        height="84"
        rx="22"
        ry="22"
        className="wt-trust-inner"
        opacity={0.55}
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
