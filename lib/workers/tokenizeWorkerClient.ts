export function createTokenizeWorker(): Worker {
  return new Worker(new URL("./tokenize.worker.ts", import.meta.url));
}
