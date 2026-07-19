"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, type CSSProperties, type ReactNode } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
import { ArrowRight, Check, Target, Users } from "lucide-react";
import {
  getProductThumb,
  type ProductShowcase,
} from "@/lib/data/product-showcase";
import { getIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/section";

export function ProductStack({ products }: { products: ProductShowcase[] }) {
  const reduce = useReducedMotion();

  return (
    <div className="relative">
      {products.map((product, index) => (
        <ProductStackCard
          key={product.id}
          product={product}
          index={index}
          total={products.length}
          reduceMotion={!!reduce}
        />
      ))}
    </div>
  );
}

function ProductStackCard({
  product,
  index,
  total,
  reduceMotion,
}: {
  product: ProductShowcase;
  index: number;
  total: number;
  reduceMotion: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // While this card is sticky, progress 0→1 as the next card slides over it
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 0.85], [1, 0.9]);
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.65]);
  const brightness = useTransform(scrollYProgress, [0, 0.85], [1, 0.92]);

  const stackOffset = Math.min(index, 8) * 14;
  const isLast = index === total - 1;

  return (
    <div
      ref={ref}
      id={product.slug}
      className={cn(
        "relative scroll-mt-28",
        isLast ? "min-h-[calc(100svh-5rem)] pb-10" : "h-[115svh] md:h-[110svh]"
      )}
      style={{ zIndex: index + 1 }}
    >
      <div
        className={cn(
          "flex items-center",
          isLast
            ? "relative min-h-[calc(100svh-6rem)] py-4"
            : "sticky top-[calc(5rem+var(--stack-peek))] h-[calc(100svh-5.5rem)]"
        )}
        style={{ ["--stack-peek" as string]: `${stackOffset}px` } as CSSProperties}
      >
        <Container className="w-full py-2">
          <StackMotion
            reduceMotion={reduceMotion}
            isLast={isLast}
            scale={scale}
            opacity={opacity}
            brightness={brightness}
          >
            <article className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-white shadow-[0_24px_64px_rgba(15,23,42,0.12)] will-change-transform">
              <ProductCardBody product={product} index={index} total={total} />
            </article>
          </StackMotion>
        </Container>
      </div>
    </div>
  );
}

function StackMotion({
  children,
  reduceMotion,
  isLast,
  scale,
  opacity,
  brightness,
}: {
  children: ReactNode;
  reduceMotion: boolean;
  isLast: boolean;
  scale: MotionValue<number>;
  opacity: MotionValue<number>;
  brightness: MotionValue<number>;
}) {
  const filter = useTransform(brightness, (v) => `brightness(${v})`);

  if (reduceMotion || isLast) {
    return <div>{children}</div>;
  }

  return (
    <motion.div style={{ scale, opacity, filter }} className="origin-top">
      {children}
    </motion.div>
  );
}

function ProductCardBody({
  product,
  index,
  total,
}: {
  product: ProductShowcase;
  index: number;
  total: number;
}) {
  const Icon = getIcon(product.icon);
  const imageSrc = getProductThumb(product.image);

  return (
    <div className="grid lg:grid-cols-[1.05fr_0.95fr] min-h-[min(62svh,560px)] max-h-[calc(100svh-6.5rem)] overflow-hidden">
      <div className="flex flex-col p-5 sm:p-7 lg:p-9 border-b lg:border-b-0 lg:border-r border-border overflow-y-auto">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge variant="outline" className="tabular-nums">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </Badge>
          <Badge variant="muted">{product.category}</Badge>
          <span
            className="ml-auto hidden sm:inline-flex h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: product.accent }}
            aria-hidden
          />
        </div>

        <div className="flex items-start gap-3 mb-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-md"
            style={{ backgroundColor: product.accent }}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#0b1f3a]">
              {product.name}
            </h2>
            <p className="mt-1 text-sm font-medium" style={{ color: product.accent }}>
              {product.tagline}
            </p>
          </div>
        </div>

        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          {product.about}
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-slate-50/80 p-3.5">
            <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
              <Target className="h-3.5 w-3.5" />
              What it is
            </div>
            <p className="text-sm text-[#0b1f3a]/85 leading-relaxed">{product.description}</p>
          </div>
          <div className="rounded-2xl border border-border bg-slate-50/80 p-3.5">
            <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
              <Users className="h-3.5 w-3.5" />
              Who it&apos;s for
            </div>
            <p className="text-sm text-[#0b1f3a]/85 leading-relaxed">{product.forWhom}</p>
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Key benefits
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {product.benefits.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-[#0b1f3a]">
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: product.accent }}
                >
                  <Check className="h-3 w-3" />
                </span>
                <span className="leading-snug">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {product.features.map((f) => (
            <Badge key={f} variant="muted">
              {f}
            </Badge>
          ))}
        </div>

        <div className="mt-auto pt-6 flex flex-wrap gap-3">
          <Button asChild size="lg" className="rounded-full">
            <Link href={`/signup?module=${product.id}`}>
              Start with {product.name}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full">
            <Link href="/pricing">See plans</Link>
          </Button>
        </div>
      </div>

      <div className="relative bg-[#f4f7fb] p-4 sm:p-5 lg:p-6 flex flex-col gap-3 min-h-[240px]">
        <div className="relative flex-1 min-h-[180px] overflow-hidden rounded-2xl border border-border shadow-sm">
          <Image
            src={imageSrc}
            alt={product.imageAlt}
            fill
            sizes="(max-width: 1024px) 100vw, 48vw"
            quality={70}
            className="object-cover"
          />
          <div
            className="absolute inset-0 opacity-40 mix-blend-multiply"
            style={{
              background: `linear-gradient(145deg, ${product.accent}55 0%, transparent 55%)`,
            }}
          />
          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2.5 rounded-xl bg-white/95 px-3 py-2.5 shadow-lg backdrop-blur">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
              style={{ backgroundColor: product.accent }}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#0b1f3a] truncate">{product.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{product.tagline}</p>
            </div>
          </div>
        </div>

        {product.preview ? (
          <div className="rounded-2xl border border-border bg-white p-3.5 shadow-sm">
            <div className="mb-2.5 flex items-center justify-between">
              <p className="text-sm font-semibold text-[#0b1f3a]">{product.preview.title}</p>
              <Badge variant="accent">Live preview</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {product.preview.kpis.map((kpi) => (
                <div key={kpi.label} className="rounded-xl border border-border bg-slate-50 px-2.5 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {kpi.label}
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 text-sm font-semibold",
                      kpi.tone === "good" && "text-emerald-600",
                      kpi.tone === "warn" && "text-amber-600",
                      kpi.tone === "bad" && "text-rose-600",
                      kpi.tone === "neutral" && "text-[#0b1f3a]"
                    )}
                  >
                    {kpi.value}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-2.5 overflow-hidden rounded-xl border border-border">
              {product.preview.rows.slice(0, 2).map((row) => (
                <div
                  key={row.ref}
                  className="flex items-center justify-between gap-3 border-b border-border last:border-0 px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-[#0b1f3a] truncate">{row.name}</p>
                    <p className="text-[11px] text-muted-foreground">{row.ref}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-medium">{row.qty}</p>
                    <p className="text-[11px] text-muted-foreground">{row.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
