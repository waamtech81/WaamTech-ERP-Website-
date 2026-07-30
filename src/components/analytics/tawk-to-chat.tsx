"use client";

import Script from "next/script";

const TAWK_EMBED_SRC =
  process.env.NEXT_PUBLIC_TAWK_EMBED_SRC?.trim() ||
  "https://embed.tawk.to/6a6aba4a50dea81d4cf38091/1juoefcrn";

declare global {
  interface Window {
    Tawk_API?: {
      maximize?: () => void;
      onLoad?: () => void;
    };
    Tawk_LoadStart?: Date;
  }
}

/** Open Tawk.to chat widget (safe if script still loading). */
export function openTawkChat() {
  if (typeof window === "undefined") return;
  try {
    if (window.Tawk_API?.maximize) {
      window.Tawk_API.maximize();
      return;
    }
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_API.onLoad = function () {
      window.Tawk_API?.maximize?.();
    };
  } catch {
    // Tawk may not be ready yet.
  }
}

/** Tawk.to live chat for WAAMTO marketing site + customer portal. */
export function TawkChat() {
  if (!TAWK_EMBED_SRC) return null;

  return (
    <Script id="tawk-to-chat" strategy="afterInteractive">{`
      var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
      (function(){
        var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
        s1.async=true;
        s1.src=${JSON.stringify(TAWK_EMBED_SRC)};
        s1.charset='UTF-8';
        s1.setAttribute('crossorigin','*');
        s0.parentNode.insertBefore(s1,s0);
      })();
    `}</Script>
  );
}
