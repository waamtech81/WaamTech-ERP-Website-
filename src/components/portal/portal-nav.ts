import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Boxes,
  Building2,
  CreditCard,
  FileText,
  Gauge,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  Package,
  Puzzle,
  Settings,
  Settings2,
  SlidersHorizontal,
  UserCircle2,
  Users,
} from "lucide-react";
import type { PortalCommercialJourney } from "@/lib/portal/package-type";

export type PortalNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  group?: "main" | "workspace" | "account" | "custom";
};

/** Predefined plan customers — unchanged existing portal nav. */
export const PORTAL_NAV: PortalNavItem[] = [
  { href: "/portal", label: "Dashboard", icon: LayoutDashboard, exact: true, group: "main" },
  { href: "/portal/licenses", label: "Licenses", icon: KeyRound, group: "main" },
  { href: "/portal/subscriptions", label: "Subscriptions", icon: Package, group: "main" },
  { href: "/portal/invoices", label: "Invoices", icon: FileText, group: "main" },
  { href: "/portal/billing", label: "Billing", icon: CreditCard, group: "main" },
  { href: "/portal/organization", label: "Organizations", icon: Building2, group: "workspace" },
  { href: "/portal/users", label: "Users", icon: Users, group: "workspace" },
  { href: "/portal/modules", label: "Modules", icon: Settings2, group: "workspace" },
  {
    href: "/portal/business-profile",
    label: "Business Profile",
    icon: UserCircle2,
    group: "workspace",
  },
  { href: "/portal/notifications", label: "Notifications", icon: Bell, group: "account" },
  { href: "/portal/settings", label: "Settings", icon: Settings, group: "account" },
];

/**
 * Custom ERP customers — no predefined plan upgrade/compare surfaces.
 * Upgrades happen via modules, feature packs, and limits only.
 */
export const CUSTOM_ERP_PORTAL_NAV: PortalNavItem[] = [
  { href: "/portal", label: "Dashboard", icon: LayoutDashboard, exact: true, group: "main" },
  { href: "/portal/licenses", label: "Active License", icon: KeyRound, group: "main" },
  { href: "/portal/modules", label: "Modules", icon: Boxes, group: "custom" },
  { href: "/portal/feature-packs", label: "Feature Packs", icon: Puzzle, group: "custom" },
  { href: "/portal/limits", label: "Limits", icon: Gauge, group: "custom" },
  { href: "/portal/custom-erp", label: "Custom ERP", icon: SlidersHorizontal, group: "custom" },
  { href: "/portal/billing", label: "Billing", icon: CreditCard, group: "main" },
  { href: "/portal/invoices", label: "Invoices", icon: FileText, group: "main" },
  { href: "/portal/organization", label: "Organizations", icon: Building2, group: "workspace" },
  { href: "/portal/users", label: "Users", icon: Users, group: "workspace" },
  { href: "/portal/support", label: "Support", icon: LifeBuoy, group: "account" },
  { href: "/portal/notifications", label: "Notifications", icon: Bell, group: "account" },
  { href: "/portal/settings", label: "Settings", icon: Settings, group: "account" },
];

export const PORTAL_NAV_GROUPS: Array<{ id: PortalNavItem["group"]; label: string }> = [
  { id: "main", label: "Overview" },
  { id: "custom", label: "Custom ERP" },
  { id: "workspace", label: "Workspace" },
  { id: "account", label: "Account" },
];

export function portalNavForJourney(journey: PortalCommercialJourney): PortalNavItem[] {
  return journey === "custom" ? CUSTOM_ERP_PORTAL_NAV : PORTAL_NAV;
}

export function isNavActive(pathname: string, item: PortalNavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
