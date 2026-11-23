import { CanonicalSavedDetailView } from "@/components/komik/canonical-saved-detail-view";

export const dynamic = "force-dynamic";

export default async function CanonicalSavedPage({
  params,
}: {
  params: Promise<{ savedTitleId: string }>;
}) {
  const { savedTitleId } = await params;
  return <CanonicalSavedDetailView savedTitleId={savedTitleId} />;
}
