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
        description="Paste keywords or upload a report (.csv, .xls, .xlsx, .txt), tick every keyword or word that doesn't fit, and export them as negatives."
        explainerSummary="How this works"
        explainerContent={
          <>
            <p>
              Paste your keywords or upload a search-terms report. Every
              keyword is listed with the words it is made of underneath, so you
              can pick either the whole keyword or just one word.
            </p>
            <p>
              Tick everything that doesn&apos;t fit your product or service -
              it collects in the Negative keywords panel. Choose Broad, Phrase,
              or Exact match, then Copy all or Export and paste the list into
              your campaign&apos;s negative keywords.
            </p>
            <p>
              Working through a large report? Switch to Word frequency to see
              which words and phrases come up most often across all your
              search terms.
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
