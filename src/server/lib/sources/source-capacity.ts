import { SourceError } from "./error";

const MAX_ACTIVE_PER_SOURCE = 8;
const MAX_ACTIVE_TOTAL = 32;
const activeBySource = new Map<string, number>();
let activeTotal = 0;

export async function withSourceCapacity<T>(sourceId: string, load: () => Promise<T>): Promise<T> {
  const active = activeBySource.get(sourceId) ?? 0;
  if (active >= MAX_ACTIVE_PER_SOURCE || activeTotal >= MAX_ACTIVE_TOTAL) {
    throw new SourceError("Sumber sedang sibuk. Coba lagi sebentar.", {
      code: "RATE_LIMITED",
      sourceId,
      statusCode: 429,
    });
  }

  activeTotal += 1;
  activeBySource.set(sourceId, active + 1);
  try {
    return await load();
  } finally {
    activeTotal -= 1;
    const remaining = (activeBySource.get(sourceId) ?? 1) - 1;
    if (remaining === 0) activeBySource.delete(sourceId);
    else activeBySource.set(sourceId, remaining);
  }
}
