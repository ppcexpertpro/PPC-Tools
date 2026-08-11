export function createMergeWorker(): Worker {
  return new Worker(new URL("./merge.worker.ts", import.meta.url));
}
