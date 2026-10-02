export const CARD_ENRICHMENT_CONCURRENCY = 3;

export interface CardEnrichmentQueue {
  run<T>(task: () => Promise<T>): Promise<T>;
}

export function createCardEnrichmentQueue(
  maxConcurrency = CARD_ENRICHMENT_CONCURRENCY
): CardEnrichmentQueue {
  if (!Number.isInteger(maxConcurrency) || maxConcurrency < 1) {
    throw new Error("Card enrichment concurrency must be a positive integer");
  }

  let activeCount = 0;
  const pending: Array<() => void> = [];

  const pump = () => {
    while (activeCount < maxConcurrency && pending.length > 0) {
      const start = pending.shift();
      if (!start) break;
      activeCount += 1;
      start();
    }
  };

  const run = <T,>(task: () => Promise<T>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      pending.push(() => {
        Promise.resolve()
          .then(task)
          .then(
            (result) => {
              activeCount -= 1;
              pump();
              resolve(result);
            },
            (error) => {
              activeCount -= 1;
              pump();
              reject(error);
            }
          );
      });
      pump();
    });

  return { run };
}

const cardEnrichmentQueue = createCardEnrichmentQueue();

export function runCardEnrichment<T>(task: () => Promise<T>): Promise<T> {
  return cardEnrichmentQueue.run(task);
}
