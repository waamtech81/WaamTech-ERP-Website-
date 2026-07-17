"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Check, Loader2, Puzzle, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { friendlyNetworkError } from "@/lib/network/errors";

type PuzzleState = {
  question: string;
  token: string;
  trackWidth: number;
  pieceSize: number;
  background: string;
  piece: string;
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
  const [captcha, setCaptcha] = useState<PuzzleState | null>(null);
  const [slideX, setSlideX] = useState(0);
  const [puzzleOpen, setPuzzleOpen] = useState(false);
  const [puzzleSolved, setPuzzleSolved] = useState(false);
  const [formStartedAt] = useState(() => Date.now());
  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const dragging = useRef(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const maxSlide = Math.max(0, (captcha?.trackWidth || 280) - (captcha?.pieceSize || 44));

  const loadCaptcha = useCallback(async () => {
    setCaptchaLoading(true);
    setError("");
    setSlideX(0);
    setPuzzleSolved(false);
    try {
      const res = await fetch("/api/contact/captcha", { method: "GET" });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        question?: string;
        token?: string;
        trackWidth?: number;
        pieceSize?: number;
        background?: string;
        piece?: string;
        message?: string;
      };
      if (
        !res.ok ||
        !data.success ||
        !data.question ||
        !data.token ||
        !data.background ||
        !data.piece
      ) {
        setError(data.message || "Could not load puzzle. Please try again.");
        setCaptcha(null);
        return;
      }
      setCaptcha({
        question: data.question,
        token: data.token,
        trackWidth: data.trackWidth || 280,
        pieceSize: data.pieceSize || 44,
        background: data.background,
        piece: data.piece,
      });
    } catch (err) {
      setError(friendlyNetworkError(err, "Could not load puzzle. Please try again."));
      setCaptcha(null);
    } finally {
      setCaptchaLoading(false);
    }
  }, []);

  async function openPuzzle() {
    setPuzzleOpen(true);
    setError("");
    setSuccess("");
    await loadCaptcha();
  }

  function closePuzzle() {
    if (puzzleSolved) {
      setPuzzleOpen(false);
      return;
    }
    setPuzzleOpen(false);
    setCaptcha(null);
    setSlideX(0);
  }

  function confirmPuzzle() {
    if (!captcha) return;
    setPuzzleSolved(true);
    setPuzzleOpen(false);
    setError("");
  }

  const allFilled = useMemo(() => {
    return (
      values.name.trim() !== "" &&
      values.email.trim() !== "" &&
      values.company.trim() !== "" &&
      values.phone.trim() !== "" &&
      values.subject.trim() !== "" &&
      values.message.trim() !== "" &&
      puzzleSolved &&
      Boolean(captcha?.token)
    );
  }, [values, captcha, puzzleSolved]);

  function update(field: keyof typeof empty, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setError("");
    setSuccess("");
  }

  function setSlideFromClientX(clientX: number) {
    const el = trackRef.current;
    if (!el || !captcha) return;
    const rect = el.getBoundingClientRect();
    const x = Math.min(maxSlide, Math.max(0, clientX - rect.left - captcha.pieceSize / 2));
    setSlideX(x);
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
          captchaSelection: Math.round(slideX),
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
        setPuzzleSolved(false);
        setCaptcha(null);
        setSlideX(0);
        return;
      }

      setSuccess(data.message || "Thanks — your message has been sent.");
      setValues({ ...empty, subject: initialSubject });
      setPuzzleSolved(false);
      setCaptcha(null);
      setSlideX(0);
    } catch (err) {
      setError(friendlyNetworkError(err, "Could not send your message. Please try again."));
      setPuzzleSolved(false);
      setCaptcha(null);
      setSlideX(0);
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
        <Label>
          Security check <span className="text-rose-500">*</span>
        </Label>

        {puzzleSolved ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <span className="inline-flex items-center gap-2 font-medium">
              <Check className="h-4 w-4" />
              Puzzle completed
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={() => void openPuzzle()}
              disabled={loading}
            >
              Redo
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-xl"
            onClick={() => void openPuzzle()}
            disabled={loading}
          >
            <Puzzle className="h-4 w-4" />
            Open puzzle captcha
          </Button>
        )}

        <p className="text-xs text-muted-foreground">
          Click to open the puzzle, then slide the piece into place to verify you&apos;re human.
        </p>
      </div>

      {puzzleOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Security puzzle"
        >
          <div className="w-full max-w-sm rounded-2xl border border-border bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#0b1f3a]">Security puzzle</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {captchaLoading
                    ? "Loading puzzle…"
                    : captcha?.question || "Unable to load puzzle"}
                </p>
              </div>
              <button
                type="button"
                onClick={closePuzzle}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close puzzle"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {captchaLoading ? (
              <div className="flex h-36 items-center justify-center rounded-xl bg-muted">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : captcha ? (
              <div className="space-y-4">
                <div
                  ref={trackRef}
                  className="relative mx-auto overflow-hidden rounded-2xl select-none"
                  style={{ width: captcha.trackWidth }}
                  onPointerDown={(e) => {
                    dragging.current = true;
                    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                    setSlideFromClientX(e.clientX);
                  }}
                  onPointerMove={(e) => {
                    if (!dragging.current) return;
                    setSlideFromClientX(e.clientX);
                  }}
                  onPointerUp={() => {
                    dragging.current = false;
                  }}
                  onPointerCancel={() => {
                    dragging.current = false;
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={captcha.background}
                    alt=""
                    className="block h-[120px] w-full pointer-events-none"
                    draggable={false}
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={captcha.piece}
                    alt=""
                    className="absolute top-[38px] pointer-events-none drop-shadow-md"
                    style={{ left: slideX, width: captcha.pieceSize, height: captcha.pieceSize }}
                    draggable={false}
                  />
                </div>

                <input
                  type="range"
                  min={0}
                  max={maxSlide}
                  value={slideX}
                  onChange={(e) => setSlideX(Number(e.target.value))}
                  className="w-full accent-primary"
                  aria-label="Slide puzzle piece"
                />

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 rounded-xl"
                    onClick={() => void loadCaptcha()}
                    disabled={captchaLoading}
                  >
                    <RefreshCw className={cn("h-4 w-4", captchaLoading && "animate-spin")} />
                    New puzzle
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 rounded-xl"
                    onClick={confirmPuzzle}
                    disabled={captchaLoading || slideX < 20}
                  >
                    <Check className="h-4 w-4" />
                    Confirm
                  </Button>
                </div>
              </div>
            ) : (
              <Button type="button" className="w-full rounded-xl" onClick={() => void loadCaptcha()}>
                Retry load
              </Button>
            )}
          </div>
        </div>
      ) : null}

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

      <Button type="submit" size="lg" disabled={!allFilled || loading}>
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
