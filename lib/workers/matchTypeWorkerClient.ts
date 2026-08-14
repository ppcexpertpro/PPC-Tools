/**
 * Bundlers only statically resolve the `new Worker(new URL(...))` pattern
 * for relative specifiers, not `@/` path aliases - kept in its own module so
 * it can also be swapped for a mock Worker in component tests (jsdom has no
 * real Worker implementation).
 */
export function createMatchTypeWorker(): Worker {
  return new Worker(new URL("./matchType.worker.ts", import.meta.url));
}
