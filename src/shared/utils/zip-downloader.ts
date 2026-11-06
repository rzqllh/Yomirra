import JSZip from "jszip";
import { saveAs } from "file-saver";
import { apiClient } from "@/shared/api-client";

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
    const { pages } = await apiClient.pagesQuery(sourceId, mangaId, chapterId).queryFn();

    if (pages.length === 0) throw new Error("Halaman tidak ditemukan");

    let downloadedCount = 0;
    if (onProgress) onProgress(0, pages.length);

    // Concurrency pool setup
    const CONCURRENCY = 3;
    let index = 0;
    const controller = new AbortController();

    const worker = async () => {
      while (!controller.signal.aborted && index < pages.length) {
        const page = pages[index++];
        try {
          const imgRes = await fetch(page.url, { signal: controller.signal });
          if (!imgRes.ok) throw new Error(`Fetch failed: ${imgRes.status}`);
          
          const blob = await imgRes.blob();
          
          // Determine extension from MIME type, fallback to jpg
          const ext = blob.type.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
          const filename = `${String(page.index + 1).padStart(3, '0')}.${ext}`;
          
          folder.file(filename, blob);
          
          downloadedCount++;
          if (onProgress) onProgress(downloadedCount, pages.length);
        } catch (error) {
          if (controller.signal.aborted) return;
          controller.abort();
          throw new Error(`Gagal mengunduh halaman ${page.index + 1}`, { cause: error });
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
