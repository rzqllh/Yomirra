import {
  STORE_SYNC_JOURNAL,
  runAtomicTransaction,
  promisifyRequest,
} from "@/shared/lib/idb-storage";
import type { SyncJournalEntry } from "@/shared/types/durable-sync";
import { resolveActiveOutboxUid } from "./outbox-manager";

export interface ReconciliationSummary {
  userId: string;
  totalPending: number;
  crashedLeasesRecovered: number;
  recoveredOpIds: string[];
  reconciledAt: number;
}

/**
 * Startup Reconciliation Engine
 *
 * Runs upon app initialization / tab rehydration:
 * 1. Scans `sync_journal` for mutations tagged with active `userId`.
 * 2. Recovers any entries stuck in `processing` status due to prior crashes or abrupt tab termination
 *    where `leaseExpiresAt < now`, resetting them back to `pending`.
 * 3. Prepares the outbox queue in a consistent state before sync workers start.
 */
export async function reconcileStartupOutbox(
  explicitUid?: string
): Promise<ReconciliationSummary> {
  const userId = resolveActiveOutboxUid(explicitUid);
  const now = Date.now();

  return runAtomicTransaction([STORE_SYNC_JOURNAL], async (stores) => {
    const store = stores[STORE_SYNC_JOURNAL];
    const index = store.index("userId");
    const userEntries = await promisifyRequest<SyncJournalEntry[]>(index.getAll(userId));

    let crashedLeasesRecovered = 0;
    const recoveredOpIds: string[] = [];
    let totalPending = 0;

    for (const entry of userEntries) {
      if (entry.status === "processing") {
        // If lease has expired or missing expiration timestamp, recover it
        if (!entry.leaseExpiresAt || entry.leaseExpiresAt <= now) {
          entry.status = "pending";
          entry.leaseExpiresAt = undefined;
          entry.retryCount = (entry.retryCount || 0) + 1;
          await promisifyRequest(store.put(entry));
          crashedLeasesRecovered++;
          recoveredOpIds.push(entry.id);
          totalPending++;
        }
      } else if (entry.status === "pending") {
        totalPending++;
      }
    }

    return {
      userId,
      totalPending,
      crashedLeasesRecovered,
      recoveredOpIds,
      reconciledAt: now,
    };
  });
}
