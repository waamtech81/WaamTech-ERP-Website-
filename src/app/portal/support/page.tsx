import { redirect } from "next/navigation";

/** Support lives in the WAAMTO application — not in the customer portal. */
export default function PortalSupportRedirectPage() {
  redirect("/portal");
}
