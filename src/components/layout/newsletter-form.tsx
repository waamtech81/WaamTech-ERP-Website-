"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiMessageFromJson, friendlyNetworkError } from "@/lib/network/errors";
import { cn } from "@/lib/utils";

export function NewsletterForm({
  variant = "light",
}: {
  variant?: "light" | "dark";
}) {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const formStartedAt = useRef(0);
  const dark = variant === "dark";

  function markFormStarted() {
    if (!formStartedAt.current) formStartedAt.current = Date.now();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          website: honeypot,
          _t: formStartedAt.current,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        setError(
          apiMessageFromJson(json, "Could not subscribe. Please try again.")
        );
        return;
      }
      setMessage(apiMessageFromJson(json, "Thanks — you are subscribed."));
      setEmail("");
      formStartedAt.current = Date.now();
    } catch (err) {
      setError(friendlyNetworkError(err, "Could not subscribe. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6">
      <p className={cn("mb-2 text-sm font-medium", dark ? "text-white" : undefined)}>
        Subscribe to product updates
      </p>
      <form className="flex gap-2" onFocusCapture={markFormStarted} onSubmit={onSubmit}>
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="absolute left-[-9999px] h-0 w-0 opacity-0"
        />
        <Input
          type="email"
          name="email"
          value={email}
          onChange={(e) => {
            markFormStarted();
            setEmail(e.target.value);
          }}
          placeholder="Work email"
          aria-label="Email for newsletter"
          className={cn(
            dark &&
              "border-white/[0.06] bg-white/[0.05] text-white placeholder:text-slate-500 focus-visible:border-sky-300/25 focus-visible:ring-sky-400/15"
          )}
          required
          disabled={loading}
        />
        <Button
          type="submit"
          disabled={loading || !email.trim()}
          className={cn(dark && "bg-primary hover:bg-primary/90")}
        >
          {loading ? "…" : "Join"}
        </Button>
      </form>
      {message ? (
        <p className={cn("mt-2 text-xs", dark ? "text-emerald-300" : "text-emerald-700")}>
          {message}
        </p>
      ) : null}
      {error ? (
        <p className={cn("mt-2 text-xs", dark ? "text-rose-300" : "text-rose-600")}>{error}</p>
      ) : null}
    </div>
  );
}
