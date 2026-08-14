import type { Metadata } from "next";
import { NegativeFinderApp } from "./NegativeFinderApp";

export const metadata: Metadata = {
  title: "Negative Keyword Finder - Mine Search Terms | PPC Tools",
  description:
    "Paste or upload a search-terms report and mine it for negative keyword candidates by word frequency - free, no login, 100% browser-based.",
};

export default function NegativeKeywordFinderPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="max-w-3xl">
        <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">
          Negative Keyword Finder
        </h1>
        <p className="mt-3 text-lg text-ink-muted">
          Paste search terms or upload a report (.csv, .xls, .xlsx, .txt) and
          mine it for negative keyword candidates by word frequency.
        </p>

        <details className="mt-4 rounded-lg border border-border bg-surface p-4 text-sm text-ink-muted">
          <summary className="cursor-pointer font-medium text-ink">
            How this works
          </summary>
          <div className="mt-3 flex flex-col gap-2">
            <p>
              Every row of your search-terms report is broken into words
              (unigrams), word pairs (bigrams), and three-word phrases
              (trigrams), then counted across the whole list - the words showing
              up most often are usually the ones worth reviewing first.
            </p>
            <p>
              Common words like &quot;a,&quot; &quot;the,&quot; and
              &quot;for&quot; are hidden by default since they rarely make
              useful negatives on their own - turn that off in the filter bar if
              you want to see everything.
            </p>
            <p>
              Click any token to add it to your selected negatives list, choose
              Broad, Phrase, or Exact match, then copy or download the result to
              paste into a new negative keyword list.
            </p>
          </div>
        </details>
      </div>

      <div className="mt-8">
        <NegativeFinderApp />
      </div>
    </main>
  );
}
