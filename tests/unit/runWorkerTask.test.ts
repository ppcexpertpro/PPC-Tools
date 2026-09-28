import { runWorkerTask } from "@/lib/workers/runWorkerTask";

type Listener = (event: MessageEvent) => void;

/**
 * Behaves like a real Worker: every listener sees every message, and
 * replies arrive in the order requests were posted.
 */
class EchoWorker {
  private listeners: Listener[] = [];
  private pending: unknown[] = [];

  addEventListener(type: string, listener: Listener) {
    if (type === "message") this.listeners.push(listener);
  }

  removeEventListener(type: string, listener: Listener) {
    if (type === "message") {
      this.listeners = this.listeners.filter((existing) => existing !== listener);
    }
  }

  postMessage(data: unknown) {
    this.pending.push(data);
  }

  flush() {
    for (const data of this.pending.splice(0)) {
      [...this.listeners].forEach((listener) =>
        listener({ data: { echo: data } } as MessageEvent),
      );
    }
  }
}

describe("runWorkerTask", () => {
  it("resolves overlapping requests with their own responses, not the first one", async () => {
    const worker = new EchoWorker();
    const first = runWorkerTask(worker as unknown as Worker, "first");
    const second = runWorkerTask(worker as unknown as Worker, "second");

    worker.flush();

    await expect(first).resolves.toEqual({ echo: "first" });
    await expect(second).resolves.toEqual({ echo: "second" });
  });
});
