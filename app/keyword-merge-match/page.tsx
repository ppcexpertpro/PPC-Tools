import type { Metadata } from "next";
import { ToolPageHeader } from "@/components/layout/ToolPageHeader";
import mergeMatchArt from "@/public/illustrations/merge-match.svg";
import { MergeMatchApp } from "./MergeMatchApp";

export const metadata: Metadata = {
  title: "Keyword Merge & Match Tool - Combine Keyword Lists | PPC Tools",
  description:
    "Combine modifier, core-term, and suffix lists into every keyword permutation, then apply match types instantly - free, no login, 100% browser-based.",
};

export default function KeywordMergeMatchPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <ToolPageHeader
        illustration={mergeMatchArt}
        title="Keyword Merge & Match Tool"
        description="Combine 2–5 keyword groups - modifiers, core terms, suffixes - into every permutation, then apply match types to the merged list at once."
        explainerSummary="How merging works"
        explainerContent={
          <>
            <p>
              Each group is a list of terms. The tool builds every combination
              across groups in the order they&apos;re arranged on screen - a
              &quot;best/top/cheap&quot; modifier group combined with a
              &quot;running shoes/hiking boots&quot; core group produces six
              keywords: every modifier paired with every core term.
            </p>
            <p>
              Groups are reorderable (drag the handle on desktop, or use the
              up/down buttons on mobile) because order matters - moving a group
              changes where its terms land in each merged phrase, not just how
              many combinations you get.
            </p>
            <p>
              The live counter updates as you type so you can see the
              combination count before merging - predicted output is capped at
              20,000 keywords per run.
            </p>
          </>
        }
      />

      <div className="mt-8">
        <MergeMatchApp />
      </div>
    </main>
  );
}
