"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Menu,
  Search,
  X,
  Boxes,
} from "lucide-react";
import { mainNav, productMegaMenu, siteConfig } from "@/lib/data/site";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "@/components/layout/global-search";

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMegaOpen(false);
  }, [pathname]);

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

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b transition-all duration-300",
          scrolled
            ? "border-border bg-white/90 backdrop-blur-xl shadow-[0_1px_0_rgba(15,23,42,0.04)]"
            : "border-transparent bg-white/80 backdrop-blur-md"
        )}
      >
        <div className="container-site flex h-16 md:h-[4.25rem] items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-sm transition-transform group-hover:scale-105">
              <Boxes className="h-4.5 w-4.5" />
            </span>
            <span className="font-[family-name:var(--font-poppins)] text-lg font-semibold tracking-tight">
              {siteConfig.name}
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {mainNav.map((item) =>
              item.title === "Products" ? (
                <div
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => setMegaOpen(true)}
                  onMouseLeave={() => setMegaOpen(false)}
                >
                  <button
                    className={cn(
                      "inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      pathname.startsWith("/products") || megaOpen
                        ? "text-primary"
                        : "text-foreground/80 hover:text-primary hover:bg-muted"
                    )}
                    aria-expanded={megaOpen}
                  >
                    Products
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", megaOpen && "rotate-180")} />
                  </button>
                  {megaOpen ? (
                    <div className="absolute left-1/2 top-full z-50 w-[720px] -translate-x-1/2 pt-3">
                      <div className="rounded-2xl border border-border bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
                        <div className="grid grid-cols-3 gap-6">
                          {productMegaMenu.map((col) => (
                            <div key={col.category}>
                              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {col.category}
                              </p>
                              <ul className="space-y-1">
                                {col.items.map((link) => (
                                  <li key={link.href + link.title}>
                                    <Link
                                      href={link.href}
                                      className="block rounded-xl px-3 py-2.5 hover:bg-muted transition-colors"
                                    >
                                      <span className="block text-sm font-medium text-foreground">
                                        {link.title}
                                      </span>
                                      {link.description ? (
                                        <span className="mt-0.5 block text-xs text-muted-foreground leading-relaxed">
                                          {link.description}
                                        </span>
                                      ) : null}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                          <p className="text-sm text-muted-foreground">
                            Explore the full WaamTech product suite.
                          </p>
                          <Button asChild size="sm">
                            <Link href="/products">View all products</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    pathname === item.href || pathname.startsWith(item.href + "/")
                      ? "text-primary"
                      : "text-foreground/80 hover:text-primary hover:bg-muted"
                  )}
                >
                  {item.title}
                </Link>
              )
            )}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:inline-flex"
              onClick={() => setSearchOpen(true)}
              aria-label="Open search"
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href="/signup">Start free trial</Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileOpen ? (
          <div className="lg:hidden border-t border-border bg-white">
            <div className="container-site py-4 space-y-1">
              <button
                onClick={() => setSearchOpen(true)}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-sm text-muted-foreground hover:bg-muted"
              >
                <Search className="h-4 w-4" />
                Search...
              </button>
              {mainNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-xl px-3 py-3 text-sm font-medium hover:bg-muted"
                >
                  {item.title}
                </Link>
              ))}
              <div className="flex gap-2 pt-3">
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild className="flex-1">
                  <Link href="/signup">Start trial</Link>
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
