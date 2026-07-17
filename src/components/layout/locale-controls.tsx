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
  tone = "light",
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
  tone?: "light" | "dark";
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

  return (
    <div className="relative notranslate" ref={rootRef} onKeyDown={onKeyDown} translate="no">
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openDropdown())}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        title={ariaLabel}
        className={cn(
          "inline-flex items-center justify-center gap-1 rounded-lg border px-2.5 py-1.5 text-sm font-semibold tracking-wide transition-colors",
          tone === "dark"
            ? "border-white/[0.06] bg-white/[0.05] text-slate-200 hover:border-white/10 hover:text-white"
            : "border-border bg-white text-foreground/80 hover:border-primary/30 hover:text-primary"
        )}
      >
        {trigger}
      </button>

      {open ? (
        <div
          className={cn(
            "absolute z-[60] overflow-hidden rounded-xl border border-border/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.16)] ring-1 ring-black/[0.03]",
            placement === "top" ? "bottom-full mb-2" : "top-full mt-2",
            align === "end" ? "right-0" : "left-0",
            panelClassName ?? "w-[11rem]"
          )}
        >
          <ul id={listId} role="listbox" aria-label={ariaLabel} className="max-h-72 overflow-y-auto py-1">
            {options.map((opt, i) => {
              const selected = opt.value === value;
              const active = i === safeActive;
              return (
                <li key={opt.value} role="none">
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    dir={opt.dir}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => choose(opt.value)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors",
                      active ? "bg-primary/5" : "hover:bg-muted",
                      selected && "font-semibold text-primary"
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="shrink-0 font-semibold tracking-wide">{opt.primary}</span>
                      {opt.secondary ? (
                        <span className="truncate text-xs text-muted-foreground">{opt.secondary}</span>
                      ) : null}
                    </span>
                    {selected ? <Check className="h-3.5 w-3.5 shrink-0 text-primary" /> : null}
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

/** Header language control — short codes only (EN, FR, AR…), no search. */
export function LanguageSwitcher({ align = "end" }: { align?: "start" | "end" }) {
  const { language, supportedLanguages, setLanguage, t } = useLocale();
  const current = supportedLanguages.find((l) => l.code === language);

  const options: Option[] = supportedLanguages.map((l) => ({
    value: l.code,
    primary: l.short,
    dir: l.direction,
  }));

  return (
    <SimpleDropdown
      trigger={
        <>
          <Globe className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          <span className="min-w-[1.5rem]" dir={current?.direction}>
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
      panelClassName="w-[8.5rem]"
    />
  );
}

/**
 * Footer currency control — clean list of name + symbol.
 * Master billing currency remains USD; this only changes display.
 */
export function CurrencySwitcher({
  align = "end",
  tone = "light",
}: {
  align?: "start" | "end";
  tone?: "light" | "dark";
}) {
  const { currency, currencies, currencyCodes, setCurrency, t } = useLocale();
  const meta = currencies[currency];

  const options: Option[] = currencyCodes.map((code) => {
    const c = currencies[code];
    return {
      value: code,
      primary: c.name,
      secondary: c.symbol,
    };
  });

  return (
    <SimpleDropdown
      tone={tone}
      trigger={
        <>
          <span className="max-w-[9rem] truncate font-medium">{meta.name}</span>
          <span
            translate="no"
            className={cn(
              "font-semibold",
              tone === "dark" ? "text-slate-400" : "text-muted-foreground"
            )}
          >
            {meta.symbol}
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
      value={currency}
      onSelect={(v) => setCurrency(v as CurrencyCode)}
      align={align}
      placement="top"
      panelClassName="w-[14rem]"
    />
  );
}

/** Header locale strip — language only (currency lives in the footer). */
export function LocaleControls() {
  return <LanguageSwitcher />;
}
