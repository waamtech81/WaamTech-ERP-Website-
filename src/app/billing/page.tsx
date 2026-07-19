import { redirect } from "next/navigation";

/** Legacy / Engine links often use /billing — Customer Portal billing lives under /portal. */
export default function BillingAliasPage() {
  redirect("/portal/billing");
}
