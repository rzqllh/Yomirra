import { redirect } from "next/navigation";

export default function UpdatesPage() {
  redirect("/library?tab=updates");
  return null;
}
