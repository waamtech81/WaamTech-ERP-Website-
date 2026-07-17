"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";

export function CookieBanner() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("waamtech-cookies");
    if (!accepted) setOpen(true);
  }, []);

  if (!open) return null;

  const accept = () => {
    localStorage.setItem("waamtech-cookies", "accepted");
    setOpen(false);
  };

  return (
    <div
      className="notranslate fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-3xl rounded-2xl border border-border bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.12)] md:p-5"
      translate="no"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t(
            "cookie.message",
            "We use cookies to improve your experience, analyze traffic, and remember your preferences."
          )}{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            {t("cookie.privacy", "Privacy policy")}
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            {t("cookie.decline", "Decline")}
          </Button>
          <Button size="sm" onClick={accept}>
            {t("cookie.accept", "Accept")}
          </Button>
        </div>
      </div>
    </div>
  );
}
