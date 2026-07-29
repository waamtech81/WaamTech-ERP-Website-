"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const CRISP_WEBSITE_ID =
  process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID?.trim() ||
  "668cfa3e-179f-4ee9-94d1-a5e38b4a6bbc";

declare global {
  interface Window {
    $crisp?: unknown[];
    CRISP_WEBSITE_ID?: string;
  }
}

/** Free-plan soft routing via Crisp session segments (Sub-Inboxes are paid). */
function segmentsForPath(pathname: string): string[] {
  const path = (pathname || "/").toLowerCase();

  if (
    path.startsWith("/portal") ||
    path.includes("billing") ||
    path.includes("invoice") ||
    path.includes("checkout") ||
    path.includes("subscription")
  ) {
    return ["billing", "department:billing"];
  }

  if (
    path.startsWith("/pricing") ||
    path.startsWith("/signup") ||
    path.startsWith("/build-your-own-erp") ||
    path.startsWith("/servers") ||
    path.startsWith("/demo") ||
    path.startsWith("/contact")
  ) {
    return ["sales", "department:sales"];
  }

  if (
    path.startsWith("/docs") ||
    path.includes("support") ||
    path.startsWith("/about") ||
    path.startsWith("/privacy") ||
    path.startsWith("/terms")
  ) {
    return ["technical-support", "department:technical-support"];
  }

  return ["general", "department:sales"];
}

/**
 * Crisp live chat for WAAMTO marketing site + customer portal.
 * Free-plan only: segments for Sales / Technical Support / Billing soft routing.
 */
export function CrispChat() {
  const pathname = usePathname() || "/";

  useEffect(() => {
    if (!CRISP_WEBSITE_ID || typeof window === "undefined") return;

    window.$crisp = window.$crisp || [];
    window.CRISP_WEBSITE_ID = CRISP_WEBSITE_ID;

    const segments = segmentsForPath(pathname);
    try {
      window.$crisp.push(["set", "session:segments", [segments]]);
      window.$crisp.push([
        "set",
        "session:data",
        [
          [
            ["department", segments.find((s) => s.startsWith("department:"))?.replace("department:", "") || "sales"],
            ["page_path", pathname],
            ["product", "WAAMTO"],
          ],
        ],
      ]);
    } catch {
      // Crisp may not be ready yet; client script will apply later pushes.
    }
  }, [pathname]);

  if (!CRISP_WEBSITE_ID) return null;

  return (
    <Script id="crisp-chat" strategy="afterInteractive">{`
      window.$crisp=window.$crisp||[];
      window.CRISP_WEBSITE_ID=${JSON.stringify(CRISP_WEBSITE_ID)};
      (function(){
        d=document;
        s=d.createElement("script");
        s.src="https://client.crisp.chat/l.js";
        s.async=1;
        d.getElementsByTagName("head")[0].appendChild(s);
      })();
    `}</Script>
  );
}
