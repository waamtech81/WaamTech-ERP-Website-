"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";
import type { UiLanguage } from "@/i18n";
import type { CurrencyCode } from "@/lib/currency/config";

type Option = {
  value: string;
  primary: string;
  secondary?: string;
  dir?: "ltr" | "rtl";
};

function SimpleDropdown({
  trigger,
  ariaLabel,
  options,
  value,
  onSelect,
  align = "end",
  placement = "bottom",
  panelClassName,
  listClassName,
  tone = "light",
  /** Keep panel LTR even when the page is RTL (language codes stay readable). */
  forceLtr = false,
  /** Symbol-only rows (footer currency) — no secondary label stretch. */
  compact = false,
}: {
  trigger: React.ReactNode;
  ariaLabel: string;
  options: Option[];
  value: string;
  onSelect: (value: string) => void;
  align?: "start" | "end";
  /** Footer currency opens upward; header language opens downward. */
  placement?: "top" | "bottom";
  panelClassName?: string;
  listClassName?: string;
  tone?: "light" | "dark";
  forceLtr?: boolean;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const safeActive = Math.min(activeIndex, Math.max(0, options.length - 1));

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function openDropdown() {
    setActiveIndex(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  }

  function choose(v: string) {
    onSelect(v);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = options[safeActive];
      if (opt) choose(opt.value);
    }
  }

  const panelTone =
    tone === "dark"
      ? "border-white/10 bg-[#0b1220] text-slate-100 shadow-[0_16px_48px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.04]"
      : "border-border/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.16)] ring-1 ring-black/[0.03]";

  return (
    <div
      className="relative notranslate"
      ref={rootRef}
      onKeyDown={onKeyDown}
      translate="no"
      dir={forceLtr ? "ltr" : undefined}
    >
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openDropdown())}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        title={ariaLabel}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm font-semibold tracking-wide transition-colors",
          tone === "dark"
            ? "border-white/[0.06] bg-white/[0.05] text-slate-200 hover:border-white/10 hover:text-white"
            : "border-border bg-white text-foreground/80 hover:border-primary/30 hover:text-primary"
        )}
      >
        {trigger}
      </button>

      {open ? (
        <div
          dir={forceLtr ? "ltr" : undefined}
          className={cn(
            "absolute z-[60] overflow-hidden rounded-xl border",
            panelTone,
            placement === "top" ? "bottom-full mb-2" : "top-full mt-2",
            // Logical inset so RTL pages still anchor the panel to the control edge
            align === "end" ? "end-0" : "start-0",
            panelClassName ?? "w-auto min-w-max"
          )}
        >
          <ul
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            className={cn(
              "py-1",
              // Currency list is short — never scroll. Language list may scroll.
              compact ? "overflow-visible" : "max-h-72 overflow-y-auto",
              listClassName
            )}
          >
            {options.map((opt, i) => {
              const selected = opt.value === value;
              const active = i === safeActive;
              return (
                <li key={opt.value} role="none">
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    dir={forceLtr ? "ltr" : opt.dir}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => choose(opt.value)}
                    className={cn(
                      "flex w-full items-center transition-colors",
                      compact
                        ? "gap-2 px-3 py-2 text-sm"
                        : "gap-3 px-3.5 py-2.5 text-sm",
                      active
                        ? tone === "dark"
                          ? "bg-white/10"
                          : "bg-primary/5"
                        : tone === "dark"
                          ? "hover:bg-white/[0.06]"
                          : "hover:bg-muted",
                      selected &&
                        (tone === "dark"
                          ? "font-semibold text-sky-300"
                          : "font-semibold text-primary")
                    )}
                  >
                    <span
                      className={cn(
                        "shrink-0 font-semibold tracking-wide tabular-nums",
                        compact ? "min-w-[2.25rem] text-center" : "inline-flex min-w-[2rem] justify-start"
                      )}
                    >
                      {opt.primary}
                    </span>
                    {!compact && opt.secondary ? (
                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate text-start text-xs",
                          selected ? "text-primary/80" : "text-muted-foreground"
                        )}
                      >
                        {opt.secondary}
                      </span>
                    ) : null}
                    {!compact ? (
                      <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                        {selected ? <Check className="h-3.5 w-3.5 text-primary" /> : null}
                      </span>
                    ) : selected ? (
                      <Check
                        className={cn(
                          "h-3.5 w-3.5 shrink-0",
                          tone === "dark" ? "text-sky-300" : "text-primary"
                        )}
                      />
                    ) : (
                      <span className="inline-block h-3.5 w-3.5 shrink-0" aria-hidden />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/** Header language control — EN / AR / FR only (default English). */
export function LanguageSwitcher({ align = "end" }: { align?: "start" | "end" }) {
  const { language, supportedLanguages, setLanguage, t } = useLocale();
  const current = supportedLanguages.find((l) => l.code === language);

  const options: Option[] = supportedLanguages.map((l) => ({
    value: l.code,
    primary: l.short,
    secondary: l.nativeLabel,
    dir: l.direction,
  }));

  return (
    <SimpleDropdown
      forceLtr
      trigger={
        <>
          <Globe className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          <span className="min-w-[1.5rem] text-center tabular-nums" dir="ltr">
            {current?.short ?? "EN"}
          </span>
        </>
      }
      ariaLabel={t("localization.selectLanguage", "Select language")}
      options={options}
      value={language}
      onSelect={(v) => setLanguage(v as UiLanguage)}
      align={align}
      placement="bottom"
      panelClassName="w-[11.5rem]"
    />
  );
}

/**
 * Footer currency control — symbols only ($, €, AED, SAR, Rs, CA$, A$).
 * Master billing currency remains USD; this only changes display.
 * Explicit allowlist — no JP/CN or country/currency names.
 */
const FOOTER_CURRENCY_CODES: CurrencyCode[] = [
  "USD",
  "EUR",
  "AED",
  "SAR",
  "PKR",
  "CAD",
  "AUD",
];

const FOOTER_CURRENCY_LABEL: Record<CurrencyCode, string> = {
  USD: "$",
  EUR: "€",
  AED: "AED",
  SAR: "SAR",
  PKR: "Rs",
  CAD: "CA$",
  AUD: "A$",
};

export function CurrencySwitcher({
  align = "end",
  tone = "light",
}: {
  align?: "start" | "end";
  tone?: "light" | "dark";
}) {
  const { currency, setCurrency, t } = useLocale();
  const active = FOOTER_CURRENCY_CODES.includes(currency) ? currency : "USD";
  const label = FOOTER_CURRENCY_LABEL[active];

  const options: Option[] = FOOTER_CURRENCY_CODES.map((code) => ({
    value: code,
    primary: FOOTER_CURRENCY_LABEL[code],
  }));

  return (
    <SimpleDropdown
      forceLtr
      compact
      tone={tone}
      trigger={
        <>
          <span
            translate="no"
            className={cn(
              "min-w-[1.75rem] text-center font-semibold tabular-nums",
              tone === "dark" ? "text-slate-200" : "text-foreground/80"
            )}
          >
            {label}
          </span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5",
              tone === "dark" ? "text-slate-400" : "text-muted-foreground"
            )}
            aria-hidden
          />
        </>
      }
      ariaLabel={t("localization.selectCurrency", "Select currency")}
      options={options}
      value={active}
      onSelect={(v) => setCurrency(v as CurrencyCode)}
      align={align}
      placement="top"
      panelClassName="w-max"
    />
  );
}

/** Header locale strip — language only (currency lives in the footer). */
export function LocaleControls() {
  return <LanguageSwitcher />;
}
