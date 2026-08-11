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
    const handleMessage = (event: MessageEvent<TResponse>) => {
      cleanup();
      resolve(event.data);
    };
    const handleError = (event: ErrorEvent) => {
      cleanup();
      reject(event.error ?? new Error(event.message));
    };
    const cleanup = () => {
      worker.removeEventListener("message", handleMessage);
      worker.removeEventListener("error", handleError);
    };

    worker.addEventListener("message", handleMessage);
    worker.addEventListener("error", handleError);
    worker.postMessage(payload);
  });
}
