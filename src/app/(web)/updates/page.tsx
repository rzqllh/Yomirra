import { redirect } from "next/navigation";

export default function UpdatesPage() {
  redirect("/bookmark?tab=updates");
  return null;
}
