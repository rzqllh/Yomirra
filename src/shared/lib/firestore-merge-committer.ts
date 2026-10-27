import type { LibraryItem } from "@/shared/store/library-store";
import type { HistoryItem } from "@/shared/store/history-store";

export class PartialBatchCommitError extends Error {
  uid: string;
  completedBatches: number;
  totalBatches: number;
  successfulWrites: number;
  recoveryKey: string;
  lastError: any;

  constructor(
    message: string,
    details: {
      uid: string;
      completedBatches: number;
      totalBatches: number;
      successfulWrites: number;
      recoveryKey: string;
      lastError?: any;
    }
  ) {
    super(message);
    this.name = "PartialBatchCommitError";
    this.uid = details.uid;
    this.completedBatches = details.completedBatches;
    this.totalBatches = details.totalBatches;
    this.successfulWrites = details.successfulWrites;
    this.recoveryKey = details.recoveryKey;
    this.lastError = details.lastError;
  }
}

export interface MergeRecoveryJournal {
  uid: string;
  startedAt: number;
  totalBatches: number;
  completedBatches: number;
  successfulWrites: number;
  status: "in-progress" | "failed" | "completed";
}

function getSafeTime(val: string | number | undefined | null): number {
  if (typeof val === "number" && !Number.isNaN(val)) return val;
  if (typeof val === "string") {
    const t = new Date(val).getTime();
    return Number.isNaN(t) ? 0 : t;
  }
  return 0;
}

function cleanRecord(item: object): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(item).filter(([, value]) => value !== undefined)
  );
}

/**
 * Direct Firestore committer for merged data.
 * Executes writes in sequential atomic batches with retries and recovery journal.
 */
export async function commitMergedDataToFirestore({
  uid,
  library,
  history,
}: {
  uid: string;
  library: Record<string, LibraryItem>;
  history: Record<string, HistoryItem>;
}): Promise<{ libraryWrites: number; historyWrites: number; totalWrites: number }> {
  const { initFirebase } = await import("@/shared/lib/firebase");
  const { loadFirestore } = await import("@/shared/lib/firestore-runtime");

  const { db: firestore } = await initFirebase();
  if (!firestore) {
    throw new Error("Koneksi Firebase tidak tersedia untuk melakukan commit.");
  }

  const { doc, writeBatch } = await loadFirestore();

  type BatchOperation = {
    type: "library" | "history";
    id: string;
    path: string;
    data: Record<string, unknown>;
  };

  const operations: BatchOperation[] = [];

  for (const [id, item] of Object.entries(library)) {
    operations.push({
      type: "library",
      id,
      path: "users/" + uid + "/libraryV2/" + id,
      data: cleanRecord(item),
    });
  }

  for (const [id, item] of Object.entries(history)) {
    operations.push({
      type: "history",
      id,
      path: "users/" + uid + "/history/" + id,
      data: cleanRecord({ ...item, readAt: getSafeTime(item.readAt) }),
    });
  }

  const BATCH_SIZE = 400;
  const chunkedOperations: BatchOperation[][] = [];
  for (let i = 0; i < operations.length; i += BATCH_SIZE) {
    chunkedOperations.push(operations.slice(i, i + BATCH_SIZE));
  }

  const totalBatches = chunkedOperations.length;
  const recoveryKey = "yomirra_merge_recovery_" + uid;

  let successfulWrites = 0;
  let libraryWrites = 0;
  let historyWrites = 0;

  if (totalBatches > 0) {
    const journal: MergeRecoveryJournal = {
      uid,
      startedAt: Date.now(),
      totalBatches,
      completedBatches: 0,
      successfulWrites: 0,
      status: "in-progress",
    };
    try {
      localStorage.setItem(recoveryKey, JSON.stringify(journal));
    } catch {
      // Non-fatal if localStorage is restricted
    }

    for (let bIndex = 0; bIndex < totalBatches; bIndex++) {
      const chunk = chunkedOperations[bIndex];
      const batch = writeBatch(firestore);

      for (const op of chunk) {
        batch.set(doc(firestore, op.path), op.data);
      }

      let committed = false;
      let lastErr: any = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await batch.commit();
          committed = true;
          break;
        } catch (err) {
          lastErr = err;
          if (attempt < 3) {
            await new Promise((r) => setTimeout(r, 150 * attempt));
          }
        }
      }

      if (!committed) {
        journal.completedBatches = bIndex;
        journal.successfulWrites = successfulWrites;
        journal.status = "failed";
        try {
          localStorage.setItem(recoveryKey, JSON.stringify(journal));
        } catch {}

        const errDetail = lastErr?.message ? ": " + lastErr.message : "";
        throw new PartialBatchCommitError(
          "Gagal melakukan commit batch " + (bIndex + 1) + " dari " + totalBatches + " ke cloud Firestore" + errDetail + ". Jurnal pemulihan tersimpan (" + recoveryKey + ").",
          {
            uid,
            completedBatches: bIndex,
            totalBatches,
            successfulWrites,
            recoveryKey,
            lastError: lastErr,
          }
        );
      }

      successfulWrites += chunk.length;
      for (const op of chunk) {
        if (op.type === "library") libraryWrites++;
        else historyWrites++;
      }

      journal.completedBatches = bIndex + 1;
      journal.successfulWrites = successfulWrites;
      try {
        localStorage.setItem(recoveryKey, JSON.stringify(journal));
      } catch {}
    }

    try {
      localStorage.removeItem(recoveryKey);
    } catch {}
  }

  return {
    libraryWrites,
    historyWrites,
    totalWrites: libraryWrites + historyWrites,
  };
}
