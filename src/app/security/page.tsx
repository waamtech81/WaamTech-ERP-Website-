import type { Metadata } from "next";
import { SecurityTrustPage } from "@/components/sections/security-trust";

export const metadata: Metadata = {
  title: "Security & Trust — Enterprise Platform Controls",
  description:
    "WAAMTO security: secure authentication, OTP, RBAC, multi-tenant isolation, TLS, backups, audit trails, and a protected customer portal.",
  keywords: [
    "ERP security",
    "multi-tenant isolation",
    "RBAC ERP",
    "WAAMTO trust",
    "secure cloud ERP",
  ],
  alternates: { canonical: "/security" },
};

export default function SecurityPage() {
  return <SecurityTrustPage />;
}
