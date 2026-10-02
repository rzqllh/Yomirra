export const MAX_CONCURRENT_CARD_DETAIL_REQUESTS = 4;

interface EnrichmentJob<T> {
  run: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
  signal?: AbortSignal;
  started: boolean;
  onAbort?: () => void;
}

const queue: EnrichmentJob<unknown>[] = [];
let activeCount = 0;

function createAbortError(): Error {
  if (typeof DOMException !== "undefined") {
    return new DOMException("Aborted", "AbortError");
  }
  const error = new Error("Aborted");
  error.name = "AbortError";
  return error;
}

function removeQueuedJob(job: EnrichmentJob<unknown>): void {
  const index = queue.indexOf(job);
  if (index >= 0) queue.splice(index, 1);
}

function pumpQueue(): void {
  while (activeCount < MAX_CONCURRENT_CARD_DETAIL_REQUESTS && queue.length > 0) {
    const job = queue.shift();
    if (!job) return;

    if (job.signal?.aborted) {
      job.reject(createAbortError());
      continue;
    }

    job.started = true;
    if (job.onAbort && job.signal) {
      job.signal.removeEventListener("abort", job.onAbort);
    }

    activeCount += 1;
    Promise.resolve()
      .then(job.run)
      .then(job.resolve, job.reject)
      .finally(() => {
        activeCount -= 1;
        pumpQueue();
      });
  }
}

export function runCardDetailEnrichment<T>(
  run: () => Promise<T>,
  signal?: AbortSignal
): Promise<T> {
  if (signal?.aborted) {
    return Promise.reject(createAbortError());
  }

  return new Promise<T>((resolve, reject) => {
    const job: EnrichmentJob<T> = {
      run,
      resolve,
      reject,
      signal,
      started: false,
    };

    if (signal) {
      job.onAbort = () => {
        if (job.started) return;
        removeQueuedJob(job as EnrichmentJob<unknown>);
        reject(createAbortError());
      };
      signal.addEventListener("abort", job.onAbort, { once: true });
    }

    queue.push(job as EnrichmentJob<unknown>);
    pumpQueue();
  });
}

export function getCardDetailEnrichmentState(): {
  active: number;
  queued: number;
} {
  return {
    active: activeCount,
    queued: queue.length,
  };
}
