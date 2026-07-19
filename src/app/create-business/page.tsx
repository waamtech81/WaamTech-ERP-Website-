import { redirect } from "next/navigation";

/** Create New Business → portal add-place / new subscription wizard. */
export default function CreateBusinessPage() {
  redirect("/portal/plans?intent=new_place");
}
