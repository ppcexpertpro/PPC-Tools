export type LimitStatus = "ok" | "warning" | "blocked";

// PRD §5.1: soft warning above 2,000 lines, hard stop above 5,000.
export const MATCH_TYPE_SOFT_WARNING_LINES = 2000;
export const MATCH_TYPE_HARD_CAP_LINES = 5000;

export function getLineCountStatus(count: number): LimitStatus {
  if (count > MATCH_TYPE_HARD_CAP_LINES) return "blocked";
  if (count > MATCH_TYPE_SOFT_WARNING_LINES) return "warning";
  return "ok";
}
