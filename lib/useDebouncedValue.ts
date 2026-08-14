import { useEffect, useState } from "react";

/**
 * Shared debounce hook (TRD §6) - used for "live preview" style
 * recomputation (e.g. Merge & Match's predicted-count counter) so fast
 * typing doesn't recompute on every keystroke. Never used for the primary
 * textarea's own value/line-count, which must stay instantly responsive.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
