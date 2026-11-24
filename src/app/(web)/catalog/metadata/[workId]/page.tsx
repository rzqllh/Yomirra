import Link from "next/link";
import {notFound} from "next/navigation";
import {getPublicMetadataWork} from "@/server/lib/metadata/mangabaka";
export const dynamic="force-dynamic";
export const metadata={title:"Katalog metadata - Yomirra",robots:{index:false,follow:false}};
export default async function MetadataWorkPage({params}:{params:Promise<{workId:string}>}){
  const {workId}=await params;
  if(!/^[1-9]\d{0,14}$/.test(workId))notFound();
  const work=await getPublicMetadataWork(Number(workId));
  if(!work)notFound();
  return <main className="mx-auto max-w-4xl space-y-6 px-4 py-6 pb-24">
    <Link href="/search" className="text-sm text-accent underline">Kembali ke pencarian</Link>
    <section className="space-y-3 rounded-xl border border-border-subtle bg-surface-raised p-5">
      <h1 className="text-2xl font-bold text-text-primary">{work.title}</h1>
      <p className="text-sm text-text-secondary">{work.format}{work.authors?.length?` · ${work.authors.join(", ")}`:""}</p>
      {work.description&&<p className="whitespace-pre-wrap text-sm text-text-secondary">{work.description}</p>}
      {work.aliases.filter(a=>a!==work.title).length>0&&<p className="text-xs text-text-secondary">Judul alternatif: {work.aliases.filter(a=>a!==work.title).slice(0,15).join(" · ")}</p>}
      <p className="text-xs text-text-secondary">Data diadaptasi dari <a className="underline" href="https://mangabaka.org/">MangaBaka</a> · <a className="underline" href="https://mangabaka.org/about/data-license">Lisensi</a>.</p>
    </section>
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Sumber bacaan</h2>
      <p className="text-sm text-text-secondary">Belum ada sumber bacaan terverifikasi pada katalog ini. Pencarian sumber tidak mengubah riwayat atau sumber utama.</p>
      <Link className="text-sm text-accent underline" href={`/search?q=${encodeURIComponent(work.title)}`}>Cari sumber bacaan</Link>
    </section>
  </main>;
}
