import { redirect } from "next/navigation";
import { getSourcesHref } from "@/shared/lib/routes";

export default function BrowseRedirectPage() {
  redirect(getSourcesHref());
}
