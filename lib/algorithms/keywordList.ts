import { splitWords } from "@/lib/algorithms/tokenize";

export interface KeywordEntry {
  /** The whole keyword, cleaned and lowercased. */
  phrase: string;
  /** Its individual words, each once - empty for a one-word keyword. */
  words: string[];
}

/**
 * The "click to separate" list: every keyword from the input, with the words
 * it is made of listed underneath so either the whole keyword or any single
 * word can be picked as a negative. Blank lines and repeat keywords are
 * dropped; input order is kept so the list reads like the pasted report.
 */
export function buildKeywordList(terms: string[]): KeywordEntry[] {
  const entries: KeywordEntry[] = [];
  const seen = new Set<string>();

  for (const term of terms) {
    const words = splitWords(term.toLowerCase());
    if (words.length === 0) continue;

    const phrase = words.join(" ");
    if (seen.has(phrase)) continue;
    seen.add(phrase);

    entries.push({
      phrase,
      words: words.length > 1 ? [...new Set(words)] : [],
    });
  }

  return entries;
}

/** Every keyword and word in the list, each once, in display order. */
export function allSelectableValues(entries: KeywordEntry[]): string[] {
  const values = new Set<string>();
  for (const entry of entries) {
    values.add(entry.phrase);
    for (const word of entry.words) values.add(word);
  }
  return [...values];
}
