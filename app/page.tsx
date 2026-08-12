import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "PPC Keyword Utilities Suite — Free Keyword Tools for Google Ads",
  description:
    "Free, no-login keyword tools for PPC specialists: match-type formatting, list merging, and negative-keyword mining. Every keyword stays in your browser.",
};

interface ToolCard {
  href: string;
  glyph: string;
  title: string;
  description: string;
  cta: string;
}

const TOOLS: ToolCard[] = [
  {
    href: "/keyword-match-type",
    glyph: '["]',
    title: "Keyword Match Type",
    description:
      "Already have a list? Format it into Broad, Phrase, Exact, and BMM — all at once.",
    cta: "Open tool",
  },
  {
    href: "/keyword-merge-match",
    glyph: "A×B",
    title: "Keyword Merge & Match",
    description:
      "Building a list from scratch? Combine modifier, core-term, and suffix lists into every permutation.",
    cta: "Open tool",
  },
  {
    href: "/negative-keyword-finder",
    glyph: "−",
    title: "Negative Keyword Finder",
    description:
      "Cleaning up live campaigns? Mine your search-terms report for negative keyword candidates.",
    cta: "Open tool",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          Paste a list.{" "}
          <span className="text-signal">Get Ads-Editor-ready output.</span>
        </h1>
        <p className="mt-4 text-lg text-ink-muted">
          Free, no-login keyword tools for PPC specialists — match-type
          formatting, list merging, and negative-keyword mining. Every keyword
          stays in your browser; nothing is ever uploaded to a server.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group relative flex flex-col gap-3 rounded-lg border border-border bg-surface p-6 transition-colors hover:border-signal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          >
            <span
              aria-hidden="true"
              className="font-mono text-2xl font-medium text-signal"
            >
              {tool.glyph}
            </span>
            <h2 className="font-display text-lg font-semibold text-ink">
              {tool.title}
            </h2>
            <p className="flex-1 text-sm text-ink-muted">{tool.description}</p>
            <span className="text-sm font-medium text-signal group-hover:underline">
              {tool.cta} →
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
