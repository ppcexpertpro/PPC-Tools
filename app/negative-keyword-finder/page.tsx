import type { Metadata } from "next";
import { ToolPageHeader } from "@/components/layout/ToolPageHeader";
import negativeFinderArt from "@/public/illustrations/negative-finder.svg";
import { NegativeFinderApp } from "./NegativeFinderApp";

export const metadata: Metadata = {
  title: "Negative Keyword Finder - Mine Search Terms | PPC Tools",
  description:
    "Paste or upload a search-terms report and mine it for negative keyword candidates by word frequency - free, no login, 100% browser-based.",
};

export default function NegativeKeywordFinderPage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto max-w-6xl px-4 py-10 outline-none sm:px-6"
    >
      <ToolPageHeader
        illustration={negativeFinderArt}
        title="Negative Keyword Finder"
        description="Paste search terms or upload a report (.csv, .xls, .xlsx, .txt) and mine it for negative keyword candidates by word frequency."
        explainerSummary="How this works"
        explainerContent={
          <>
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
          </>
        }
      />

      <div className="mt-8">
        <NegativeFinderApp />
      </div>
    </main>
  );
}
