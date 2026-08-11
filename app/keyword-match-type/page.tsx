import type { Metadata } from "next";
import { MatchTypeApp } from "./MatchTypeApp";

export const metadata: Metadata = {
  title: "Keyword Match Type Tool — Broad, Phrase, Exact & BMM | PPC Tools",
  description:
    "Paste a keyword list and get Broad, Phrase, Exact, and Broad Match Modifier (legacy) formatted output instantly — free, no login, 100% browser-based.",
};

export default function KeywordMatchTypePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="max-w-3xl">
        <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">
          Keyword Match Type Tool
        </h1>
        <p className="mt-3 text-lg text-ink-muted">
          Paste a list of keywords and convert it to Broad, Phrase, Exact, and
          BMM (legacy) match types at once — clean, deduplicated, and ready to
          paste into Google Ads Editor.
        </p>

        <details className="mt-4 rounded-lg border border-border bg-surface p-4 text-sm text-ink-muted">
          <summary className="cursor-pointer font-medium text-ink">
            How match types work
          </summary>
          <div className="mt-3 flex flex-col gap-2">
            <p>
              Google and Microsoft Ads use wrapper syntax to control how closely
              a search has to match your keyword before your ad is eligible to
              show: <span className="font-mono text-ink">running shoes</span>{" "}
              (Broad) can match loosely related searches,{" "}
              <span className="font-mono text-ink">
                &quot;running shoes&quot;
              </span>{" "}
              (Phrase) requires the phrase in order, and{" "}
              <span className="font-mono text-ink">[running shoes]</span>{" "}
              (Exact) requires a close match to the term itself.
            </p>
            <p>
              Broad Match Modifier (
              <span className="font-mono text-ink">+running +shoes</span>) is
              labeled &quot;legacy&quot; here because Google folded BMM behavior
              into Phrase match in 2021 — it&apos;s included because exported
              legacy lists and Bing Ads conventions still use it.
            </p>
            <p>
              Re-processing an already-formatted list is safe: existing wrapper
              characters are stripped before a new match type is applied, so you
              won&apos;t end up with{" "}
              <span className="font-mono text-ink">
                [&quot;running shoes&quot;]
              </span>
              .
            </p>
          </div>
        </details>
      </div>

      <div className="mt-8">
        <MatchTypeApp />
      </div>
    </main>
  );
}
