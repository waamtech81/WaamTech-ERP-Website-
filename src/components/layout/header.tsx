"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  LogIn,
  Menu,
  Search,
  Sparkles,
  X,
  Boxes,
} from "lucide-react";
import {
  productMegaMenu,
  otherMegaMenu,
  siteConfig,
  pricingPlans,
} from "@/lib/data/site";
import {
  featuredIndustryIds,
  getCategoriesForIndustry,
  getFeaturedIndustries,
  getIndustryLucideIcon,
  hierarchyStats,
  isHotCategory,
} from "@/lib/data/business-hierarchy";
import { getIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlobalSearch } from "@/components/layout/global-search";
import { LocaleControls } from "@/components/layout/locale-controls";
import { useLocale } from "@/components/providers/locale-provider";
import { getAppLoginUrl } from "@/lib/auth/config";

type DropdownKey = "products" | "industries" | "other" | null;

function NavDropdown({
  label,
  open,
  onOpen,
  onClose,
  active,
  children,
  panelClassName,
}: {
  label: string;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  active: boolean;
  children: React.ReactNode;
  panelClassName?: string;
}) {
  return (
    <div className="relative" onMouseEnter={onOpen} onMouseLeave={onClose}>
      <button
        type="button"
        className={cn(
          "notranslate inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          active || open
            ? "text-primary bg-primary/5"
            : "text-foreground/80 hover:text-primary hover:bg-muted"
        )}
        aria-expanded={open}
        translate="no"
      >
        {label}
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")}
        />
      </button>
      {open ? (
        <div className={cn("absolute left-1/2 top-full z-50 -translate-x-1/2 pt-2", panelClassName)}>
          {children}
        </div>
      ) : null}
    </div>
  );
}

function MegaPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.14)] ring-1 ring-black/[0.03]",
        className
      )}
    >
      {children}
    </div>
  );
}

function MobileAccordion({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/70 overflow-hidden">
      <button
        onClick={onToggle}
        className="notranslate flex w-full items-center justify-between px-4 py-3.5 text-sm font-semibold bg-muted/40 hover:bg-muted/70 transition-colors"
        translate="no"
      >
        {title}
        <ChevronDown
          className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>
      {open ? <div className="px-3 pb-3 pt-1 bg-white space-y-1">{children}</div> : null}
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const { t, formatPrice } = useLocale();
  const fromUsd = Math.min(
    ...pricingPlans
      .map((p) => p.yearlyPrice ?? p.monthlyPrice)
      .filter((v): v is number => typeof v === "number" && v > 0)
  );
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdown, setDropdown] = useState<DropdownKey>(null);
  const [mobileAccordion, setMobileAccordion] = useState<DropdownKey>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeIndustryId, setActiveIndustryId] = useState<string>(featuredIndustryIds[0]);
  const [industriesExpanded, setIndustriesExpanded] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { featured, all: allIndustries } = getFeaturedIndustries();
  const menuIndustries = industriesExpanded ? allIndustries : featured;
  const activeIndustry =
    allIndustries.find((i) => i.id === activeIndustryId) ||
    featured.find((i) => i.id === activeIndustryId) ||
    featured[0];
  const activeCategories = activeIndustry
    ? getCategoriesForIndustry(activeIndustry.id).slice(0, 12)
    : [];

  function openMenu(key: DropdownKey) {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setDropdown(key);
  }

  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setDropdown(null);
      setIndustriesExpanded(false);
      closeTimer.current = null;
    }, 180);
  }

  function cancelClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDropdown(null);
    setMobileAccordion(null);
    setIndustriesExpanded(false);
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href + "/"));

  const otherActive =
    isActive("/erp-features") ||
    isActive("/mobile-app") ||
    isActive("/servers") ||
    isActive("/plans") ||
    isActive("/docs") ||
    isActive("/knowledge-base") ||
    isActive("/support") ||
    isActive("/faqs") ||
    isActive("/about") ||
    isActive("/blog") ||
    isActive("/contact") ||
    isActive("/portal");

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b transition-all duration-300",
          scrolled
            ? "border-border bg-white/92 backdrop-blur-xl shadow-[0_1px_0_rgba(15,23,42,0.04)]"
            : "border-transparent bg-white/85 backdrop-blur-md"
        )}
      >
        <div className="container-site flex h-16 md:h-[4.25rem] items-center justify-between gap-3 lg:gap-4">
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-sm transition-transform group-hover:scale-105">
              <Boxes className="h-4.5 w-4.5" />
            </span>
            <span className="flex flex-col leading-none" translate="no">
              <span className="font-[family-name:var(--font-poppins)] text-lg font-semibold tracking-tight">
                {siteConfig.name}
              </span>
              <span className="mt-0.5 hidden text-[10px] font-medium text-muted-foreground sm:block">
                {siteConfig.productLine}
              </span>
            </span>
          </Link>

          <nav className="hidden xl:flex items-center gap-0.5">
            {/* Full-width Products mega menu */}
            <div
              className="relative"
              onMouseEnter={() => openMenu("products")}
              onMouseLeave={scheduleClose}
            >
              <button
                type="button"
                className={cn(
                  "notranslate inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive("/products") || dropdown === "products"
                    ? "text-primary bg-primary/5"
                    : "text-foreground/80 hover:text-primary hover:bg-muted"
                )}
                aria-expanded={dropdown === "products"}
                translate="no"
              >
                {t("nav.products", "Products")}
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    dropdown === "products" && "rotate-180"
                  )}
                />
              </button>
              {dropdown === "products" ? (
                <div
                  className="fixed inset-x-0 top-16 md:top-[4.25rem] z-50 px-3 sm:px-4 md:px-6"
                  onMouseEnter={() => {
                    cancelClose();
                    openMenu("products");
                  }}
                  onMouseLeave={scheduleClose}
                >
                  <div className="h-3 w-full" aria-hidden />
                  <MegaPanel className="mx-auto w-full max-w-[1400px]">
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px]">
                      <div className="p-5 lg:p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
                          {productMegaMenu.map((col) => (
                            <div key={col.category}>
                              <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-primary/70">
                                {col.category}
                              </p>
                              <ul className="space-y-0.5">
                                {col.items.map((link) => {
                                  const Icon = getIcon(link.icon ?? "Boxes");
                                  return (
                                    <li key={link.href + link.title}>
                                      <Link
                                        href={link.href}
                                        className="group flex gap-3 rounded-xl px-2.5 py-2.5 hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent transition-all"
                                      >
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                          <Icon className="h-4 w-4" />
                                        </span>
                                        <span className="min-w-0">
                                          <span className="block text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                            {link.title}
                                          </span>
                                          {link.description ? (
                                            <span className="mt-0.5 block text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                              {link.description}
                                            </span>
                                          ) : null}
                                        </span>
                                      </Link>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="relative bg-gradient-to-br from-[#0b1f3a] via-[#132d54] to-primary p-6 text-white flex flex-col justify-center">
                        <Badge className="mb-3 w-fit bg-white/15 text-white border-white/20 hover:bg-white/15">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Launch offer
                        </Badge>
                        <p className="text-lg font-semibold leading-snug">50% off all plans</p>
                        <p className="mt-2 text-sm text-white/70 leading-relaxed">
                          Start your 14-day free trial. From{" "}
                          <span translate="no" suppressHydrationWarning>
                            {formatPrice(fromUsd)}
                          </span>
                          /mo.
                        </p>
                        <Button
                          asChild
                          size="sm"
                          className="mt-5 w-full rounded-full bg-white text-[#0b1f3a] hover:bg-slate-100"
                        >
                          <Link href="/signup">Start free trial</Link>
                        </Button>
                      </div>
                    </div>
                  </MegaPanel>
                </div>
              ) : null}
            </div>

            {/* Full-width Industries mega menu */}
            <div
              className="relative"
              onMouseEnter={() => openMenu("industries")}
              onMouseLeave={scheduleClose}
            >
              <button
                type="button"
                className={cn(
                  "notranslate inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive("/industries") || dropdown === "industries"
                    ? "text-primary bg-primary/5"
                    : "text-foreground/80 hover:text-primary hover:bg-muted"
                )}
                aria-expanded={dropdown === "industries"}
                translate="no"
              >
                {t("nav.industries", "Industries")}
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    dropdown === "industries" && "rotate-180"
                  )}
                />
              </button>
              {dropdown === "industries" ? (
                <div
                  className="fixed inset-x-0 top-16 md:top-[4.25rem] z-50 px-3 sm:px-4 md:px-6"
                  onMouseEnter={() => {
                    cancelClose();
                    openMenu("industries");
                  }}
                  onMouseLeave={scheduleClose}
                >
                  <div className="h-3 w-full" aria-hidden />
                  <MegaPanel className="mx-auto w-full max-w-[1400px]">
                    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr]">
                      <div className="border-b lg:border-b-0 lg:border-r border-border bg-slate-50/80 p-2.5 flex flex-col min-h-0 min-w-0 overflow-x-hidden">
                        <p className="px-2 mb-1.5 text-[11px] font-bold uppercase tracking-widest text-primary/70">
                          Industries
                          <span className="ml-1.5 font-semibold text-muted-foreground normal-case tracking-normal">
                            ({menuIndustries.length})
                          </span>
                        </p>
                        <ul
                          className={cn(
                            "space-y-0.5 min-w-0",
                            industriesExpanded &&
                              "max-h-[min(52vh,420px)] overflow-y-auto overflow-x-hidden scrollbar-thin pr-1"
                          )}
                        >
                          {menuIndustries.map((ind) => {
                            const Icon = getIcon(getIndustryLucideIcon(ind));
                            const active = activeIndustryId === ind.id;
                            const catCount = getCategoriesForIndustry(ind.id).length;
                            return (
                              <li key={ind.id}>
                                <button
                                  type="button"
                                  onMouseEnter={() => setActiveIndustryId(ind.id)}
                                  onFocus={() => setActiveIndustryId(ind.id)}
                                  onClick={() => setActiveIndustryId(ind.id)}
                                  className={cn(
                                    "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors",
                                    active
                                      ? "bg-white shadow-sm ring-1 ring-primary/15"
                                      : "hover:bg-white/80"
                                  )}
                                >
                                  <span
                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white"
                                    style={{ backgroundColor: ind.color }}
                                  >
                                    <Icon className="h-3.5 w-3.5" />
                                  </span>
                                  <span className="min-w-0 flex-1 flex items-center gap-1.5">
                                    <span className="block text-[13px] font-medium truncate leading-tight">
                                      {ind.name}
                                    </span>
                                    <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-primary">
                                      {catCount}
                                    </span>
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                        {allIndustries.length > featured.length ? (
                          <button
                            type="button"
                            onClick={() => setIndustriesExpanded((v) => !v)}
                            className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold text-primary hover:bg-white transition-colors"
                          >
                            {industriesExpanded ? (
                              <>
                                Show less
                                <ChevronUp className="h-3.5 w-3.5" />
                              </>
                            ) : (
                              <>
                                Expand more
                                <ChevronDown className="h-3.5 w-3.5" />
                              </>
                            )}
                          </button>
                        ) : null}
                      </div>

                      <div className="p-4 sm:p-5 lg:p-6 min-w-0 overflow-x-hidden">
                        {activeIndustry ? (
                          <>
                            <div className="mb-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                                    Business categories
                                  </p>
                                  <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                    {getCategoriesForIndustry(activeIndustry.id).length}
                                  </span>
                                </div>
                                <h3 className="mt-1 text-lg font-semibold text-[#0b1f3a]">
                                  {activeIndustry.name}
                                </h3>
                                <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
                                  {activeIndustry.description}
                                </p>
                              </div>
                              <Button asChild size="sm" className="rounded-full shrink-0">
                                <Link href={`/industries/${activeIndustry.id}`}>
                                  View industry
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                              </Button>
                            </div>
                            <div className="max-h-[min(48vh,400px)] overflow-y-auto overflow-x-hidden scrollbar-thin pr-1">
                              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                                {activeCategories.map((cat) => {
                                  const CatIcon = getIcon(getIndustryLucideIcon(activeIndustry));
                                  const hot = isHotCategory(cat.id);
                                  return (
                                    <Link
                                      key={cat.id}
                                      href={`/signup?industry=${activeIndustry.id}&profile=${cat.id}`}
                                      className="flex items-start gap-2.5 rounded-xl border border-border px-3 py-3 hover:border-primary/30 hover:bg-primary/[0.03] transition-colors min-w-0"
                                    >
                                      <span
                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
                                        style={{ backgroundColor: activeIndustry.color }}
                                      >
                                        <CatIcon className="h-3.5 w-3.5" />
                                      </span>
                                      <span className="min-w-0">
                                        <span className="flex items-center gap-1.5 min-w-0">
                                          <span className="block text-sm font-medium text-[#0b1f3a] truncate">
                                            {cat.name}
                                          </span>
                                          {hot ? (
                                            <span className="shrink-0 rounded bg-orange-500/90 px-1 py-px text-[9px] font-bold uppercase tracking-wide text-white leading-none">
                                              Hot
                                            </span>
                                          ) : null}
                                        </span>
                                        <span className="mt-0.5 block text-[11px] text-muted-foreground">
                                          POS {cat.pos_mode}
                                          {cat.mobile_mode === "required" ? " · Mobile" : ""}
                                        </span>
                                      </span>
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                            {getCategoriesForIndustry(activeIndustry.id).length > 12 ? (
                              <p className="mt-3 text-xs text-muted-foreground">
                                +{getCategoriesForIndustry(activeIndustry.id).length - 12} more on
                                the industry page
                              </p>
                            ) : null}
                            <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border pt-4">
                              <p className="text-sm text-muted-foreground">
                                {hierarchyStats.categories} business categories across{" "}
                                {hierarchyStats.industries} industries
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <Button asChild size="sm" variant="outline" className="rounded-full">
                                  <Link href="/industries">Browse all</Link>
                                </Button>
                                <Button asChild size="sm" className="rounded-full">
                                  <Link href={`/signup?industry=${activeIndustry.id}`}>
                                    Start trial
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </MegaPanel>
                </div>
              ) : null}
            </div>

            <Link
              href="/pricing"
              className={cn(
                "notranslate rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive("/pricing")
                  ? "text-primary bg-primary/5"
                  : "text-foreground/80 hover:text-primary hover:bg-muted"
              )}
              translate="no"
            >
              {t("nav.pricing", "Pricing")}
            </Link>

            <NavDropdown
              label={t("nav.other", "Other")}
              open={dropdown === "other"}
              onOpen={() => openMenu("other")}
              onClose={scheduleClose}
              active={otherActive || dropdown === "other"}
              panelClassName="w-[min(720px,calc(100vw-2rem))]"
            >
              <MegaPanel className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {otherMegaMenu.map((col) => (
                    <div key={col.category}>
                      <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-primary/70">
                        {col.category}
                      </p>
                      <ul className="space-y-0.5">
                        {col.items.map((link) => {
                          const Icon = getIcon(link.icon ?? "Boxes");
                          return (
                            <li key={link.href + link.title}>
                              <Link
                                href={link.href}
                                className="group flex gap-2.5 rounded-xl px-2 py-2 hover:bg-muted transition-colors"
                              >
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                  <Icon className="h-3.5 w-3.5" />
                                </span>
                                <span className="min-w-0">
                                  <span className="block text-sm font-medium">{link.title}</span>
                                  {link.description ? (
                                    <span className="mt-0.5 block text-xs text-muted-foreground line-clamp-2">
                                      {link.description}
                                    </span>
                                  ) : null}
                                </span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </MegaPanel>
            </NavDropdown>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:inline-flex"
              onClick={() => setSearchOpen(true)}
              aria-label={t("header.search", "Search")}
            >
              <Search className="h-4 w-4" />
            </Button>
            <div className="hidden lg:block">
              <LocaleControls />
            </div>
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="hidden md:inline-flex"
              aria-label={t("header.login", "Log in")}
              title={t("header.login", "Log in")}
            >
              <a href={getAppLoginUrl()}>
                <LogIn className="h-4 w-4" />
              </a>
            </Button>
            <Button
              asChild
              size="sm"
              className="hidden sm:inline-flex rounded-full px-4 lg:px-5 shadow-sm shadow-primary/15 notranslate"
            >
              <Link href="/signup" translate="no">
                {t("header.createAccount", "Create account")}
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="xl:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={t("header.toggleMenu", "Toggle menu")}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileOpen ? (
          <div className="xl:hidden border-t border-border bg-white max-h-[calc(100dvh-4rem)] overflow-y-auto">
            <div className="container-site py-4 space-y-2">
              <button
                onClick={() => setSearchOpen(true)}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-sm text-muted-foreground hover:bg-muted border border-border"
              >
                <Search className="h-4 w-4" />
                {t("header.searchEllipsis", "Search...")}
              </button>

              <MobileAccordion
                title={t("nav.products", "Products")}
                open={mobileAccordion === "products"}
                onToggle={() =>
                  setMobileAccordion((v) => (v === "products" ? null : "products"))
                }
              >
                {productMegaMenu.flatMap((col) => col.items).map((link) => (
                  <Link
                    key={link.href + link.title}
                    href={link.href}
                    className="block rounded-lg px-3 py-2.5 text-sm hover:bg-muted"
                  >
                    <span className="font-medium">{link.title}</span>
                    {link.description ? (
                      <span className="block text-xs text-muted-foreground mt-0.5">
                        {link.description}
                      </span>
                    ) : null}
                  </Link>
                ))}
              </MobileAccordion>

              <MobileAccordion
                title={t("nav.industries", "Industries")}
                open={mobileAccordion === "industries"}
                onToggle={() =>
                  setMobileAccordion((v) => (v === "industries" ? null : "industries"))
                }
              >
                <p className="px-3 py-1 text-xs text-muted-foreground">
                  Featured first · {hierarchyStats.categories} categories
                </p>
                {featured.map((ind) => (
                  <Link
                    key={ind.id}
                    href={`/industries/${ind.id}`}
                    className="block rounded-lg px-3 py-2.5 text-sm hover:bg-muted font-medium"
                  >
                    {ind.name}
                    <span className="block text-xs text-muted-foreground font-normal">
                      {getCategoriesForIndustry(ind.id).length} categories
                    </span>
                  </Link>
                ))}
                <Link
                  href="/industries"
                  className="notranslate block rounded-lg px-3 py-2.5 text-sm text-primary font-medium"
                  translate="no"
                >
                  {t("header.viewAllIndustries", "View all industries")} →
                </Link>
              </MobileAccordion>

              <Link
                href="/pricing"
                className="notranslate block rounded-xl border border-border px-4 py-3.5 text-sm font-semibold hover:bg-muted"
                translate="no"
              >
                {t("nav.pricing", "Pricing")}
              </Link>

              <MobileAccordion
                title={t("nav.other", "Other")}
                open={mobileAccordion === "other"}
                onToggle={() => setMobileAccordion((v) => (v === "other" ? null : "other"))}
              >
                {otherMegaMenu.flatMap((col) => col.items).map((link) => (
                  <Link
                    key={link.href + link.title}
                    href={link.href}
                    className="block rounded-lg px-3 py-2.5 text-sm hover:bg-muted font-medium"
                  >
                    {link.title}
                  </Link>
                ))}
              </MobileAccordion>

              <div className="rounded-xl border border-border/70 bg-muted/30 p-3 notranslate" translate="no">
                <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("localization.language", "Language")}
                </p>
                <LocaleControls />
              </div>

              <div className="flex gap-2 pt-2 notranslate" translate="no">
                <Button asChild variant="outline" className="flex-1 rounded-full">
                  <a href={getAppLoginUrl()}>
                    <LogIn className="h-4 w-4" />
                    {t("header.login", "Log in")}
                  </a>
                </Button>
                <Button asChild className="flex-1 rounded-full">
                  <Link href="/signup">{t("header.startTrial", "Start trial")}</Link>
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </header>
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
