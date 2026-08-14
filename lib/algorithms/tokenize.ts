import { STOPWORDS } from "@/lib/text/stopwords";

export type NgramSize = 1 | 2 | 3;

export interface TokenizeFilters {
  hideStopwords?: boolean;
  minLength?: number;
  minFrequency?: number;
}

export interface FrequencyRow {
  token: string;
  count: number;
  pctOfRows: number;
}

export type TokenizeResult = Partial<Record<NgramSize, FrequencyRow[]>>;

const DEFAULT_MIN_LENGTH = 3;
const DEFAULT_MIN_FREQUENCY = 1;

/**
 * An n-gram is only treated as a stopword when EVERY word in it is a
 * stopword - "for the" is filtered when hiding stopwords, but "buy the"
 * (a mix) is not, since "buy" is meaningful.
 */
function isStopwordOnly(token: string): boolean {
  return token.split(" ").every((word) => STOPWORDS.has(word));
}

export function tokenizeAndCount(
  terms: string[],
  ngramSizes: NgramSize[],
  filters: TokenizeFilters = {},
): TokenizeResult {
  const {
    hideStopwords = true,
    minLength = DEFAULT_MIN_LENGTH,
    minFrequency = DEFAULT_MIN_FREQUENCY,
  } = filters;

  const frequency: Record<NgramSize, Map<string, number>> = {
    1: new Map(),
    2: new Map(),
    3: new Map(),
  };

  let totalRows = 0;
  for (const term of terms) {
    const text = term.trim().toLowerCase();
    if (text.length === 0) continue;
    totalRows += 1;

    const words = text.split(/\s+/).filter((word) => word.length > 0);
    for (const n of ngramSizes) {
      for (let i = 0; i <= words.length - n; i++) {
        const gram = words.slice(i, i + n).join(" ");
        frequency[n].set(gram, (frequency[n].get(gram) ?? 0) + 1);
      }
    }
  }

  const results: TokenizeResult = {};
  for (const n of ngramSizes) {
    const rows: FrequencyRow[] = [];
    for (const [token, count] of frequency[n]) {
      rows.push({
        token,
        count,
        pctOfRows: totalRows > 0 ? count / totalRows : 0,
      });
    }

    const filtered = rows.filter(
      (row) =>
        row.token.length >= minLength &&
        row.count >= minFrequency &&
        (!hideStopwords || !isStopwordOnly(row.token)),
    );
    filtered.sort((a, b) => b.count - a.count);
    results[n] = filtered;
  }

  return results;
}
