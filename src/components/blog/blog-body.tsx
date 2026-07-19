import Image from "next/image";
import type { BlogBlock } from "@/types";
import { optimizeImageUrl } from "@/lib/images";

export function BlogBody({ blocks }: { blocks: BlogBlock[] }) {
  return (
    <div className="mt-10 space-y-6 text-[#334155] leading-relaxed">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "h2":
            return (
              <h2
                key={i}
                className="pt-4 text-2xl font-semibold tracking-tight text-[#0b1f3a] text-balance"
              >
                {block.text}
              </h2>
            );
          case "h3":
            return (
              <h3
                key={i}
                className="pt-2 text-xl font-semibold tracking-tight text-[#0b1f3a] text-balance"
              >
                {block.text}
              </h3>
            );
          case "quote":
            return (
              <blockquote
                key={i}
                className="border-l-4 border-primary/40 bg-slate-50/80 px-5 py-4 rounded-r-xl"
              >
                <p className="text-base italic text-[#0b1f3a]/90 leading-relaxed">
                  “{block.text}”
                </p>
                {block.attribution ? (
                  <footer className="mt-2 text-sm text-muted-foreground not-italic">
                    — {block.attribution}
                  </footer>
                ) : null}
              </blockquote>
            );
          case "note":
            return (
              <aside
                key={i}
                className="rounded-xl border border-sky-200/80 bg-sky-50/70 px-4 py-3 text-sm text-sky-950/90"
              >
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-sky-700">
                  Note
                </p>
                <p className="leading-relaxed">{block.text}</p>
              </aside>
            );
          case "image":
            return (
              <figure key={i} className="my-8 overflow-hidden rounded-xl border border-border bg-muted">
                <div className="relative aspect-[16/9] w-full max-h-[320px]">
                  <Image
                    src={optimizeImageUrl(block.src, { width: 1000 })}
                    alt={block.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 720px"
                    quality={70}
                    className="object-cover"
                  />
                </div>
                {block.caption ? (
                  <figcaption className="px-4 py-2.5 text-center text-xs text-muted-foreground">
                    {block.caption}
                  </figcaption>
                ) : null}
              </figure>
            );
          case "p":
          default:
            return (
              <p key={i} className="text-[1.05rem] leading-[1.75]">
                {block.text}
              </p>
            );
        }
      })}
    </div>
  );
}
