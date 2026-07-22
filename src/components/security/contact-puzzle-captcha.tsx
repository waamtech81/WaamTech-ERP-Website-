"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Challenge = {
  question: string;
  token: string;
  trackWidth: number;
  pieceSize: number;
  background: string;
  piece: string;
};

export type PuzzleCaptchaValue = {
  token: string;
  offset: number;
} | null;

type Props = {
  onChange: (value: PuzzleCaptchaValue) => void;
  className?: string;
};

export function ContactPuzzleCaptcha({ onChange, className }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startOffset = useRef(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [offset, setOffset] = useState(0);
  const [verified, setVerified] = useState(false);

  const maxOffset = challenge ? challenge.trackWidth - challenge.pieceSize - 4 : 0;

  const loadChallenge = useCallback(async () => {
    setLoading(true);
    setError("");
    setVerified(false);
    setOffset(0);
    onChange(null);

    try {
      const res = await fetch("/api/contact/captcha", { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as Challenge & {
        success?: boolean;
        message?: string;
      };

      if (!res.ok || !data.token || !data.background || !data.piece) {
        throw new Error(data.message || "Could not load security puzzle.");
      }

      setChallenge({
        question: data.question,
        token: data.token,
        trackWidth: data.trackWidth,
        pieceSize: data.pieceSize,
        background: data.background,
        piece: data.piece,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load security puzzle.");
      setChallenge(null);
    } finally {
      setLoading(false);
    }
  }, [onChange]);

  useEffect(() => {
    void loadChallenge();
  }, [loadChallenge]);

  function commitOffset(next: number) {
    if (!challenge) return;
    const clamped = Math.max(0, Math.min(next, maxOffset));
    setOffset(clamped);
    setVerified(false);
    onChange({ token: challenge.token, offset: clamped });
  }

  function onPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    if (!challenge || loading) return;
    dragging.current = true;
    startX.current = e.clientX;
    startOffset.current = offset;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (!dragging.current) return;
    const delta = e.clientX - startX.current;
    commitOffset(startOffset.current + delta);
  }

  function onPointerUp(e: React.PointerEvent<HTMLButtonElement>) {
    if (!dragging.current) return;
    dragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    setVerified(true);
  }

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading security puzzle…
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className={cn("space-y-3", className)}>
        <p className="text-sm text-rose-600">{error || "Security puzzle unavailable."}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => void loadChallenge()}>
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-sm font-medium text-foreground">{challenge.question}</p>
      <div
        ref={trackRef}
        className="relative overflow-hidden rounded-2xl border border-border bg-slate-900 shadow-inner"
        style={{ width: challenge.trackWidth, maxWidth: "100%" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={challenge.background}
          alt="Security puzzle background"
          className="block h-[120px] w-full select-none"
          draggable={false}
        />
        <button
          type="button"
          aria-label="Drag puzzle piece into place"
          className={cn(
            "absolute top-1/2 z-10 -translate-y-1/2 cursor-grab touch-none rounded-xl shadow-lg ring-2 ring-white/80 active:cursor-grabbing",
            verified && "ring-emerald-400"
          )}
          style={{
            left: offset,
            width: challenge.pieceSize,
            height: challenge.pieceSize,
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={challenge.piece}
            alt=""
            className="h-full w-full select-none rounded-xl"
            draggable={false}
          />
        </button>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Drag the piece to fit the gap — this confirms you are a real person, not a bot.
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={() => void loadChallenge()}>
          <RefreshCw className="h-4 w-4" />
          New puzzle
        </Button>
      </div>
    </div>
  );
}
