"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type CaptchaTile = {
  id: string;
  image: string;
};

type CaptchaState = {
  question: string;
  token: string;
  tiles: CaptchaTile[];
};

const empty = {
  name: "",
  email: "",
  company: "",
  phone: "",
  subject: "",
  message: "",
};

export function ContactForm({
  initialSubject = "",
  intent = null,
}: {
  initialSubject?: string;
  intent?: string | null;
}) {
  const [values, setValues] = useState(() => ({
    ...empty,
    subject: initialSubject,
  }));
  const [captcha, setCaptcha] = useState<CaptchaState | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [formStartedAt] = useState(() => Date.now());
  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadCaptcha = useCallback(async () => {
    setCaptchaLoading(true);
    setError("");
    setSelected([]);
    try {
      const res = await fetch("/api/contact/captcha", { method: "GET" });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        question?: string;
        token?: string;
        tiles?: CaptchaTile[];
        message?: string;
      };
      if (
        !res.ok ||
        !data.success ||
        !data.question ||
        !data.token ||
        !Array.isArray(data.tiles) ||
        data.tiles.length !== 9
      ) {
        setError(data.message || "Could not load captcha. Please refresh.");
        setCaptcha(null);
        return;
      }
      setCaptcha({
        question: data.question,
        token: data.token,
        tiles: data.tiles,
      });
    } catch {
      setError("Could not load captcha. Please refresh.");
      setCaptcha(null);
    } finally {
      setCaptchaLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCaptcha();
  }, [loadCaptcha]);

  const allFilled = useMemo(() => {
    return (
      values.name.trim() !== "" &&
      values.email.trim() !== "" &&
      values.company.trim() !== "" &&
      values.phone.trim() !== "" &&
      values.subject.trim() !== "" &&
      values.message.trim() !== "" &&
      selected.length > 0 &&
      Boolean(captcha?.token)
    );
  }, [values, captcha, selected]);

  function update(field: keyof typeof empty, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setError("");
    setSuccess("");
  }

  function toggleTile(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setError("");
    setSuccess("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allFilled || !captcha || loading) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          email: values.email.trim(),
          company: values.company.trim(),
          phone: values.phone.trim(),
          subject: values.subject.trim(),
          message: values.message.trim(),
          intent: intent || undefined,
          captchaToken: captcha.token,
          captchaSelection: selected,
          website: honeypot,
          _t: formStartedAt,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string;
      };

      if (!res.ok || !data.success) {
        setError(data.message || "Could not send your message. Please try again.");
        await loadCaptcha();
        return;
      }

      setSuccess(data.message || "Thanks — your message has been sent.");
      setValues({ ...empty, subject: initialSubject });
      setSelected([]);
      await loadCaptcha();
    } catch {
      setError("Could not send your message. Please try again.");
      await loadCaptcha();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="relative space-y-4" onSubmit={onSubmit} noValidate>
      <div className="absolute -left-[9999px] top-auto h-0 w-0 overflow-hidden" aria-hidden>
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">
            Full name <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            placeholder="Alex Morgan"
            required
            value={values.name}
            onChange={(e) => update("name", e.target.value)}
            autoComplete="name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">
            Work email <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="alex@company.com"
            required
            value={values.email}
            onChange={(e) => update("email", e.target.value)}
            autoComplete="email"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="company">
            Company <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="company"
            name="company"
            placeholder="Acme Operations"
            required
            value={values.company}
            onChange={(e) => update("company", e.target.value)}
            autoComplete="organization"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">
            Phone <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+971 50 000 0000"
            required
            value={values.phone}
            onChange={(e) => update("phone", e.target.value)}
            autoComplete="tel"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">
          Subject <span className="text-rose-500">*</span>
        </Label>
        <Input
          id="subject"
          name="subject"
          placeholder="Demo request / Enterprise quote"
          required
          value={values.subject}
          onChange={(e) => update("subject", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">
          Message <span className="text-rose-500">*</span>
        </Label>
        <Textarea
          id="message"
          name="message"
          placeholder="Tell us about your current systems and goals..."
          required
          value={values.message}
          onChange={(e) => update("message", e.target.value)}
        />
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-muted/40 p-4">
        <div className="flex items-center justify-between gap-3">
          <Label>
            Security check <span className="text-rose-500">*</span>
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-muted-foreground"
            onClick={() => void loadCaptcha()}
            disabled={captchaLoading || loading}
            aria-label="Refresh captcha"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${captchaLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <p className="text-sm font-semibold text-[#0b1f3a]">
          {captchaLoading ? "Loading captcha…" : captcha?.question || "Unavailable"}
        </p>

        {captchaLoading ? (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square animate-pulse rounded-xl bg-slate-200/80"
              />
            ))}
          </div>
        ) : captcha ? (
          <div
            className="grid grid-cols-3 gap-2"
            role="group"
            aria-label={captcha.question}
          >
            {captcha.tiles.map((tile) => {
              const isOn = selected.includes(tile.id);
              return (
                <button
                  key={tile.id}
                  type="button"
                  onClick={() => toggleTile(tile.id)}
                  aria-pressed={isOn}
                  className={cn(
                    "relative aspect-square overflow-hidden rounded-xl border-2 bg-white transition-all",
                    isOn
                      ? "border-primary ring-2 ring-primary/25 scale-[0.98]"
                      : "border-border hover:border-primary/40"
                  )}
                >
                  {/* data URI SVG tiles — next/image not needed */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={tile.image}
                    alt=""
                    className="h-full w-full object-cover pointer-events-none select-none"
                    draggable={false}
                  />
                  {isOn ? (
                    <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}

        <p className="text-xs text-muted-foreground">
          Tap every matching image. Wrong or reused answers are rejected — bots and spam are blocked.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-rose-600" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="text-sm text-emerald-700" role="status">
          {success}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={!allFilled || loading || captchaLoading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending…
          </>
        ) : (
          "Send message"
        )}
      </Button>
    </form>
  );
}
