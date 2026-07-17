import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Building2,
  CreditCard,
  FileText,
  HeadphonesIcon,
  KeyRound,
  LayoutDashboard,
  Package,
  Settings,
  Settings2,
  UserCircle2,
  Users,
} from "lucide-react";

export type PortalNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  group?: "main" | "workspace" | "account";
};

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
  { href: "/portal/support", label: "Support Tickets", icon: HeadphonesIcon, group: "account" },
  { href: "/portal/notifications", label: "Notifications", icon: Bell, group: "account" },
  { href: "/portal/settings", label: "Settings", icon: Settings, group: "account" },
];

export const PORTAL_NAV_GROUPS: Array<{ id: PortalNavItem["group"]; label: string }> = [
  { id: "main", label: "Overview" },
  { id: "workspace", label: "Workspace" },
  { id: "account", label: "Account" },
];

export function isNavActive(pathname: string, item: PortalNavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
