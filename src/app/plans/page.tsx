import { redirect } from "next/navigation";

/** Plans page removed from public site — pricing lives at /pricing. */
export default function PlansPage() {
  redirect("/pricing");
}
