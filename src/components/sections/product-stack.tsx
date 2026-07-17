import Link from "next/link";
import Image from "next/image";
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
  return (
    <div className="relative">
      {products.map((product, index) => (
        <ProductStackCard
          key={product.id}
          product={product}
          index={index}
          total={products.length}
        />
      ))}
    </div>
  );
}

function ProductStackCard({
  product,
  index,
  total,
}: {
  product: ProductShowcase;
  index: number;
  total: number;
}) {
  const isLast = index === total - 1;
  // Peek offset so cards stack softly instead of hard-covering
  const stackOffset = Math.min(index, 6) * 10;

  return (
    <div
      id={product.slug}
      className={cn(
        "relative scroll-mt-28",
        isLast ? "h-auto min-h-[100svh] pb-10" : "h-[118svh] md:h-[112svh]"
      )}
      style={{ zIndex: index + 1 }}
    >
      <div
        className={cn(
          "flex items-start md:items-center",
          isLast
            ? "relative min-h-[calc(100svh-6rem)] py-6"
            : "sticky h-[calc(100svh-5.5rem)]"
        )}
        style={
          isLast
            ? undefined
            : { top: `calc(5rem + ${stackOffset}px)` }
        }
      >
        <Container className="w-full py-2">
          <article className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.1)]">
            <ProductCardBody product={product} index={index} total={total} />
          </article>
        </Container>
      </div>
    </div>
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
    <div className="grid lg:grid-cols-[1.05fr_0.95fr] min-h-[min(68svh,600px)]">
      <div className="flex flex-col p-6 sm:p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-border">
        <div className="flex flex-wrap items-center gap-2 mb-5">
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

        <div className="flex items-start gap-3 mb-4">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md"
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

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-slate-50/80 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
              <Target className="h-3.5 w-3.5" />
              What it is
            </div>
            <p className="text-sm text-[#0b1f3a]/85 leading-relaxed">{product.description}</p>
          </div>
          <div className="rounded-2xl border border-border bg-slate-50/80 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
              <Users className="h-3.5 w-3.5" />
              Who it&apos;s for
            </div>
            <p className="text-sm text-[#0b1f3a]/85 leading-relaxed">{product.forWhom}</p>
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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

        <div className="mt-5 flex flex-wrap gap-2">
          {product.features.map((f) => (
            <Badge key={f} variant="muted">
              {f}
            </Badge>
          ))}
        </div>

        <div className="mt-auto pt-8 flex flex-wrap gap-3">
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

      <div className="relative bg-[#f4f7fb] p-5 sm:p-6 lg:p-7 flex flex-col gap-4 min-h-[280px]">
        <div className="relative flex-1 min-h-[200px] overflow-hidden rounded-2xl border border-border shadow-sm">
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
          <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
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
            <div className="mt-3 overflow-hidden rounded-xl border border-border">
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
