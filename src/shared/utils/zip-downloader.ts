import JSZip from "jszip";
import { saveAs } from "file-saver";

interface DownloadChapterArgs {
  sourceId: string;
  mangaId: string;
  chapterId: string;
  chapterTitle: string;
  mangaTitle: string;
  onProgress?: (current: number, total: number) => void;
}

export async function downloadChapterAsZip({
  sourceId,
  mangaId,
  chapterId,
  chapterTitle,
  mangaTitle,
  onProgress
}: DownloadChapterArgs): Promise<void> {
  const zip = new JSZip();
  const folderName = `${mangaTitle} - ${chapterTitle}`.replace(/[<>:"/\\|?*]+/g, ''); // sanitize filename
  const folder = zip.folder(folderName);
  
  if (!folder) throw new Error("Gagal membuat zip folder");

  try {
    // Fetch chapter pages
    const res = await fetch(`/api/sources/${sourceId}/manga/${encodeURIComponent(mangaId)}/chapters/${encodeURIComponent(chapterId)}/pages`);
    if (!res.ok) throw new Error("Gagal mengambil daftar halaman chapter");
    
    const result = await res.json();
    const pages: { index: number; url: string }[] = result.data?.pages ?? [];
    
    if (pages.length === 0) throw new Error("Halaman tidak ditemukan");

    let downloadedCount = 0;
    if (onProgress) onProgress(0, pages.length);

    // Concurrency pool setup
    const CONCURRENCY = 3;
    let index = 0;

    const worker = async () => {
      while (index < pages.length) {
        const page = pages[index++];
        const proxyUrl = page.url.startsWith('/api/proxy/image') 
          ? page.url 
          : `/api/proxy/image?url=${encodeURIComponent(page.url)}&sourceId=${sourceId}`;
        
        try {
          const imgRes = await fetch(proxyUrl);
          if (!imgRes.ok) throw new Error(`Fetch failed: ${imgRes.status}`);
          
          const blob = await imgRes.blob();
          
          // Determine extension from MIME type, fallback to jpg
          const ext = blob.type.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
          const filename = `${String(page.index + 1).padStart(3, '0')}.${ext}`;
          
          folder.file(filename, blob);
          
          downloadedCount++;
          if (onProgress) onProgress(downloadedCount, pages.length);
        } catch (error) {
          console.error(`Failed to download page ${page.index}`, error);
          // Decide whether to throw or continue. For a zip, a missing page is bad, so throw.
          throw new Error(`Gagal mengunduh halaman ${page.index + 1}`);
        }
      }
    };

    const workers = Array(Math.min(CONCURRENCY, pages.length)).fill(0).map(worker);
    await Promise.all(workers);

    // Generate and save zip
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${folderName}.zip`);

  } catch (error) {
    console.error("Zip download failed:", error);
    throw error;
  }
}
