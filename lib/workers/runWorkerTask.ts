interface PendingTask {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}

/**
 * Per-worker FIFO of in-flight requests. A Worker handles messages in order
 * and replies in order, so the Nth reply belongs to the Nth request. Without
 * this, every in-flight request's listener fired on the FIRST reply - so
 * changing a filter mid-count resolved the new request with the stale
 * result, and the newer reply was dropped on the floor.
 */
const queues = new WeakMap<Worker, PendingTask[]>();

function getQueue(worker: Worker): PendingTask[] {
  const existing = queues.get(worker);
  if (existing) return existing;

  const queue: PendingTask[] = [];
  queues.set(worker, queue);
  worker.addEventListener("message", (event: MessageEvent) => {
    queue.shift()?.resolve(event.data);
  });
  worker.addEventListener("error", (event: ErrorEvent) => {
    // A crash takes every queued request down with it - none will get a reply.
    const error = event.error ?? new Error(event.message);
    for (const task of queue.splice(0)) task.reject(error);
  });
  return queue;
}

/**
 * One-shot request/response over a Web Worker. Callers own the Worker
 * instance (created once, reused across Process clicks); this just wraps a
 * single postMessage round-trip in a promise. TRD §9: a crash here should
 * surface as a generic "something went wrong" toast, never a silent failure.
 */
export function runWorkerTask<TRequest, TResponse>(
  worker: Worker,
  payload: TRequest,
): Promise<TResponse> {
  return new Promise((resolve, reject) => {
    getQueue(worker).push({
      resolve: resolve as (value: unknown) => void,
      reject,
    });
    worker.postMessage(payload);
  });
}
