"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  X,
} from "lucide-react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { cn } from "@/lib/utils";
import { getAccessibleNav } from "@/components/portal/portal-access";
import { isNavActive, PORTAL_NAV_GROUPS } from "@/components/portal/portal-nav";
import { usePortalContext } from "@/components/portal/portal-data-provider";
import { formatPortalDateTime } from "@/components/portal/use-portal-data";
import { PortalStatusBadge } from "@/components/portal/portal-ui";

export function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data } = usePortalContext();
  const [pending, startTransition] = useTransition();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [headerQuery, setHeaderQuery] = useState("");
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Portal is light-only — never follow OS dark preference or saved dark theme.
  useEffect(() => {
    try {
      localStorage.setItem("wt_portal_theme", "light");
    } catch {
      /* ignore */
    }
    document.documentElement.classList.remove("portal-dark");
    document.documentElement.classList.add("portal-app");
    return () => {
      document.documentElement.classList.remove("portal-app");
    };
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
    setProfileOpen(false);
    setNotifOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotifOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileOpen(false);
        setNotifOpen(false);
        setSidebarOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  async function logout(allDevices = false) {
    startTransition(async () => {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allDevices }),
      });
      router.replace("/login");
    });
  }

  const accessibleNav = useMemo(() => getAccessibleNav(data), [data]);

  const filteredNav = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return accessibleNav;
    return accessibleNav.filter((item) => item.label.toLowerCase().includes(q));
  }, [accessibleNav, query]);

  const commandResults = useMemo(() => {
    const q = headerQuery.trim().toLowerCase();
    if (!q) return [];
    return accessibleNav.filter((item) => item.label.toLowerCase().includes(q)).slice(0, 6);
  }, [accessibleNav, headerQuery]);

  const customerName = data?.overview?.customerName || "Customer";
  const company = data?.overview?.company || "Workspace";
  const workspace =
    data?.customer?.workspace_name || data?.overview?.company || "Workspace";
  const plan = data?.subscription?.currentPlan || null;
  const notifications = data?.notifications || [];
  const unread =
    typeof data?.unreadNotifications === "number"
      ? data.unreadNotifications
      : notifications.filter((n) => !n.read).length;

  return (
    <div className="portal-app-shell fixed inset-0 z-[100] flex bg-[var(--portal-bg)] text-[var(--portal-fg)]">
      <AnimatePresence>
        {sidebarOpen ? (
          <motion.button
            type="button"
            aria-label="Close navigation"
            className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        ) : null}
      </AnimatePresence>

      <aside
        className={cn(
          "portal-sidebar fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col border-r border-[var(--portal-border)] bg-[var(--portal-panel)] transition-transform duration-300 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Customer portal navigation"
      >
        <div className="flex h-16 items-center justify-between gap-3 border-b border-[var(--portal-border)] px-5">
          <BrandLogo hideTagline height={26} />
          <button
            type="button"
            className="portal-focus-ring rounded-lg p-2 text-[var(--portal-muted)] hover:bg-[var(--portal-soft)] lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-[var(--portal-border)] px-4 py-4">
          <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--portal-muted)]">
              Workspace
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-[var(--portal-fg)]">{workspace}</p>
            {plan ? (
              <div className="mt-2">
                <PortalStatusBadge status={plan} />
              </div>
            ) : null}
          </div>
        </div>

        <div className="px-4 py-4">
          <label className="sr-only" htmlFor="portal-nav-search">
            Search navigation
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--portal-muted)]" />
            <input
              id="portal-nav-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter pages…"
              className="portal-focus-ring h-10 w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] pl-9 pr-3 text-sm outline-none transition focus:border-[var(--portal-primary)] focus:ring-2 focus:ring-[var(--portal-primary)]/20"
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-thin">
          {PORTAL_NAV_GROUPS.map((group) => {
            const items = filteredNav.filter((i) => i.group === group.id);
            if (!items.length) return null;
            return (
              <div key={group.id} className="mb-5">
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--portal-muted)]">
                  {group.label}
                </p>
                <ul className="space-y-0.5">
                  {items.map((item) => {
                    const active = isNavActive(pathname, item);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "portal-nav-item portal-focus-ring group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                            active
                              ? "bg-[var(--portal-primary-soft)] text-[var(--portal-primary)]"
                              : "text-[var(--portal-muted)] hover:bg-[var(--portal-soft)] hover:text-[var(--portal-fg)]"
                          )}
                          aria-current={active ? "page" : undefined}
                        >
                          <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-[var(--portal-border)] p-3">
          <button
            type="button"
            disabled={pending}
            onClick={() => logout(false)}
            className="portal-focus-ring flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--portal-muted)] transition hover:bg-rose-500/10 hover:text-rose-600"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="portal-topbar sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[var(--portal-border)] bg-[var(--portal-panel)]/90 px-4 backdrop-blur-xl sm:px-6">
          <button
            type="button"
            className="portal-focus-ring rounded-xl border border-[var(--portal-border)] p-2 text-[var(--portal-muted)] hover:bg-[var(--portal-soft)] lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
            aria-expanded={sidebarOpen}
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <p className="truncate text-sm font-semibold text-[var(--portal-fg)]">{customerName}</p>
              <span className="hidden text-[var(--portal-muted)] sm:inline" aria-hidden>
                ·
              </span>
              <p className="hidden truncate text-sm text-[var(--portal-muted)] sm:block">{company}</p>
              {plan ? (
                <PortalStatusBadge status={plan} className="ml-1 hidden md:inline-flex" />
              ) : null}
            </div>
          </div>

          <div className="relative hidden min-w-[220px] max-w-sm flex-1 md:block lg:max-w-md">
            <label className="sr-only" htmlFor="portal-header-search">
              Search portal
            </label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--portal-muted)]" />
            <input
              id="portal-header-search"
              value={headerQuery}
              onChange={(e) => setHeaderQuery(e.target.value)}
              placeholder="Search pages…"
              className="portal-focus-ring h-10 w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] pl-9 pr-3 text-sm outline-none transition focus:border-[var(--portal-primary)] focus:ring-2 focus:ring-[var(--portal-primary)]/20"
              autoComplete="off"
            />
            <AnimatePresence>
              {commandResults.length ? (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 overflow-hidden rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-panel)] shadow-[var(--portal-shadow-lg)]"
                  role="listbox"
                  aria-label="Search results"
                >
                  {commandResults.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="option"
                      onClick={() => setHeaderQuery("")}
                      className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-[var(--portal-soft)]"
                    >
                      <item.icon className="h-4 w-4 text-[var(--portal-muted)]" />
                      {item.label}
                    </Link>
                  ))}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((v) => !v);
                  setProfileOpen(false);
                }}
                className="portal-focus-ring relative rounded-xl border border-[var(--portal-border)] p-2 text-[var(--portal-muted)] transition hover:bg-[var(--portal-soft)] hover:text-[var(--portal-fg)]"
                aria-label="Notifications"
                aria-expanded={notifOpen}
                aria-haspopup="menu"
              >
                <Bell className="h-4 w-4" />
                {unread > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--portal-primary)] px-1 text-[10px] font-semibold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                ) : null}
              </button>

              <AnimatePresence>
                {notifOpen ? (
                  <motion.div
                    role="menu"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-panel)] shadow-[var(--portal-shadow-lg)]"
                  >
                    <div className="flex items-center justify-between border-b border-[var(--portal-border)] px-4 py-3">
                      <p className="text-sm font-semibold">Notifications</p>
                      <Link
                        href="/portal/notifications"
                        className="text-xs font-medium text-[var(--portal-primary)] hover:underline"
                        onClick={() => setNotifOpen(false)}
                      >
                        View all
                      </Link>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length ? (
                        notifications.slice(0, 6).map((n) => (
                          <div
                            key={n.id}
                            className="border-b border-[var(--portal-border)] px-4 py-3 last:border-b-0"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium text-[var(--portal-fg)]">{n.title}</p>
                              <PortalStatusBadge status={n.read ? "Read" : "Unread"} />
                            </div>
                            {n.created_at ? (
                              <p className="mt-1 text-xs text-[var(--portal-muted)]">
                                {formatPortalDateTime(n.created_at)}
                              </p>
                            ) : null}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center text-sm text-[var(--portal-muted)]">
                          You&apos;re all caught up.
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen((v) => !v);
                  setNotifOpen(false);
                }}
                className="portal-focus-ring inline-flex items-center gap-2 rounded-xl border border-[var(--portal-border)] px-2.5 py-1.5 text-sm transition hover:bg-[var(--portal-soft)]"
                aria-expanded={profileOpen}
                aria-haspopup="menu"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--portal-primary-soft)] text-xs font-semibold text-[var(--portal-primary)]">
                  {customerName.slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden max-w-[7rem] truncate text-sm font-medium lg:inline">
                  {customerName.split(" ")[0]}
                </span>
                <ChevronDown className="hidden h-3.5 w-3.5 text-[var(--portal-muted)] sm:block" />
              </button>

              <AnimatePresence>
                {profileOpen ? (
                  <motion.div
                    role="menu"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-panel)] shadow-[var(--portal-shadow-lg)]"
                  >
                    <div className="border-b border-[var(--portal-border)] px-4 py-3">
                      <p className="truncate text-sm font-medium">{customerName}</p>
                      <p className="truncate text-xs text-[var(--portal-muted)]">
                        {data?.overview?.primaryEmail}
                      </p>
                    </div>
                    <div className="p-1.5">
                      <Link
                        href="/portal/settings"
                        role="menuitem"
                        className="block rounded-xl px-3 py-2 text-sm hover:bg-[var(--portal-soft)]"
                      >
                        Profile & settings
                      </Link>
                      <Link
                        href="/portal/business-profile"
                        role="menuitem"
                        className="block rounded-xl px-3 py-2 text-sm hover:bg-[var(--portal-soft)]"
                      >
                        Business profile
                      </Link>
                      <Link
                        href="/portal/billing"
                        role="menuitem"
                        className="block rounded-xl px-3 py-2 text-sm hover:bg-[var(--portal-soft)]"
                      >
                        Billing
                      </Link>
                      <button
                        type="button"
                        role="menuitem"
                        disabled={pending}
                        onClick={() => logout(true)}
                        className="block w-full rounded-xl px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-500/10"
                      >
                        Logout all devices
                      </button>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main id="portal-main" className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
          <div className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            {data?.accessNotice ? (
              <div
                role="status"
                className={
                  data.accessNotice.level === "danger"
                    ? "mb-6 rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3"
                    : data.accessNotice.level === "warning"
                      ? "mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3"
                      : "mb-6 rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-3"
                }
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--portal-fg)]">
                      {data.accessNotice.title}
                      <span className="ml-2 inline-flex align-middle">
                        <PortalStatusBadge status={data.accessNotice.status} />
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-[var(--portal-muted)]">
                      {data.accessNotice.message}
                    </p>
                  </div>
                  {data.accessNotice.actionHref ? (
                    <Link
                      href={data.accessNotice.actionHref}
                      className="rounded-xl bg-[var(--portal-primary)] px-3 py-2 text-xs font-semibold text-white"
                    >
                      {data.accessNotice.actionLabel || "Continue"}
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : null}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
