"use client";

import { motion, useReducedMotion } from "framer-motion";

export type JourneyItem = {
  year: string;
  title: string;
  text: string;
};

export function JourneyTimeline({ items }: { items: JourneyItem[] }) {
  const reduce = useReducedMotion();

  return (
    <div className="relative mx-auto max-w-3xl">
      <div
        className="absolute bottom-3 left-[1.15rem] top-3 w-px bg-gradient-to-b from-primary/50 via-border to-transparent md:left-1/2 md:-translate-x-px"
        aria-hidden
      />
      <ol className="space-y-10">
        {items.map((item, i) => {
          const right = i % 2 === 1;
          return (
            <motion.li
              key={item.year}
              initial={reduce ? false : { opacity: 0, y: 36, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.45, margin: "-10% 0px -10% 0px" }}
              transition={{ duration: 0.55, delay: 0.04, ease: [0.22, 1, 0.36, 1] }}
              className="relative grid gap-3 pl-12 md:grid-cols-2 md:gap-10 md:pl-0"
            >
              <motion.span
                initial={reduce ? false : { scale: 0.6, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true, amount: 0.8 }}
                transition={{ duration: 0.35, delay: 0.08 }}
                className="absolute left-3 top-1.5 z-[1] flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary bg-white text-[10px] font-bold text-primary shadow-sm md:left-1/2 md:-translate-x-1/2"
              >
                {String(item.year).slice(2)}
              </motion.span>
              <div
                className={`rounded-2xl border border-border bg-white p-4 shadow-[0_10px_32px_rgba(15,23,42,0.06)] md:p-5 ${
                  right ? "md:col-start-2" : "md:col-start-1 md:text-right"
                }`}
              >
                <p className="text-sm font-semibold text-primary">{item.year}</p>
                <h3 className="mt-1 text-lg font-semibold text-[#0b1f3a]">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
