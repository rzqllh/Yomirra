import { redirect } from "next/navigation";

export default function BookmarkPage() {
  redirect("/library?tab=riwayat");
  return null;
}
