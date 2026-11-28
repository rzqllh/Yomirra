import { ObservedCatalogDetailView } from "@/components/komik/observed-catalog-detail-view";
import { observedCatalogBackHref, parseObservedCatalogRefs } from "@/shared/lib/observed-catalog";

export const dynamic="force-dynamic";
export const metadata={title:"Detail katalog - Yomirra",robots:{index:false,follow:false}};

export default async function ObservedCatalogPage({searchParams}:{searchParams:Promise<{refs?:string|string[];returnTo?:string|string[]}>}) {
  const params=await searchParams;
  return <ObservedCatalogDetailView refs={parseObservedCatalogRefs(params.refs)} returnTo={observedCatalogBackHref(params.returnTo)} />;
}
