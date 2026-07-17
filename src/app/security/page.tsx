import type { Metadata } from "next";
import { SecurityTrustPage } from "@/components/sections/security-trust";

export const metadata: Metadata = {
  title: "Security & Trust",
  description:
    "Enterprise-grade security for WAAMTO — secure authentication, OTP verification, RBAC, multi-tenant isolation, encrypted connections, backups, and audit trails.",
};

export default function SecurityPage() {
  return <SecurityTrustPage />;
}
