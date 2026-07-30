"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { isAuthSurfacePath } from "@/lib/routing/auth-surfaces";

const TAWK_EMBED_SRC =
  process.env.NEXT_PUBLIC_TAWK_EMBED_SRC?.trim() ||
  "https://embed.tawk.to/6a6aba4a50dea81d4cf38091/1juoefcrn";

declare global {
  interface Window {
    Tawk_API?: {
      maximize?: () => void;
      showWidget?: () => void;
      onLoad?: () => void;
    };
    Tawk_LoadStart?: Date;
  }
}

function ensureTawkReady(onReady: () => void) {
  if (typeof window === "undefined") return;
  window.Tawk_API = window.Tawk_API || {};
  if (typeof window.Tawk_API.maximize === "function") {
    onReady();
    return;
  }
  const previous = window.Tawk_API.onLoad;
  window.Tawk_API.onLoad = function () {
    if (typeof previous === "function") previous();
    onReady();
  };
}

/** Open Tawk.to chat widget (safe if script still loading). */
export function openTawkChat() {
  ensureTawkReady(() => {
    window.Tawk_API?.showWidget?.();
    window.Tawk_API?.maximize?.();
  });
}

/** Tawk.to live chat — skipped on auth surfaces; deferred until the app is idle. */
export function TawkChat() {
  const pathname = usePathname() || "/";
  const skip = !TAWK_EMBED_SRC || isAuthSurfacePath(pathname);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (skip) {
      setReady(false);
      return;
    }

    let cancelled = false;
    const mount = () => {
      if (!cancelled) setReady(true);
    };

    if ("requestIdleCallback" in window && typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(mount, { timeout: 5000 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }

    const timer = window.setTimeout(mount, 2500);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [skip]);

  if (skip || !ready) return null;

  return (
    <Script id="tawk-to-chat" strategy="lazyOnload">{`
      var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
      (function(){
        var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
        s1.async=true;
        s1.src=${JSON.stringify(TAWK_EMBED_SRC)};
        s1.charset='UTF-8';
        s1.setAttribute('crossorigin','*');
        s0.parentNode.insertBefore(s1,s0);
      })();
      Tawk_API.onLoad=function(){
        if(typeof Tawk_API.showWidget==="function"){Tawk_API.showWidget();}
      };
    `}</Script>
  );
}
