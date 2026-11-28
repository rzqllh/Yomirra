import { CanonicalSavedDetailView } from "@/components/komik/canonical-saved-detail-view";

export const dynamic = "force-dynamic";

function decodeSavedTitleId(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export default async function CanonicalSavedPage({
  params,
}: {
  params: Promise<{ savedTitleId: string }>;
}) {
  const { savedTitleId } = await params;
  // App Router passes an encoded segment. Decode once to recover the stored ID.
  return <CanonicalSavedDetailView savedTitleId={decodeSavedTitleId(savedTitleId)} />;
}
