import { redirect } from "next/navigation";

/** Portal-scoped alias for Create New Business. */
export default function PortalCreateBusinessPage() {
  redirect("/portal/plans?intent=new_place");
}
