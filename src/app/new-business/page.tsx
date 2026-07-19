import { redirect } from "next/navigation";

/** Alias for Create New Business. */
export default function NewBusinessPage() {
  redirect("/portal/plans?intent=new_place");
}
