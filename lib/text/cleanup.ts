// Letters, numbers, spaces, and - ' & (PRD §5.1 "Strip special characters" /
// §5.2 "Remove extra symbols") - shared across every tool's cleanup options.
const DISALLOWED_CHARS = /[^a-zA-Z0-9\s\-'&]/g;

export function collapseSpaces(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function removeDisallowedChars(text: string): string {
  return text.replace(DISALLOWED_CHARS, "");
}

/** Case-insensitive dedupe that keeps the first occurrence's original casing. */
export function dedupeCaseInsensitive(lines: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}
