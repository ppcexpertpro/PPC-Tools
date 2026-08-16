import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { ArrowRightIcon, ShieldIcon } from "@/components/shared/icons";
import heroWorkflow from "@/public/illustrations/hero-workflow.svg";
import matchTypeArt from "@/public/illustrations/match-type.svg";
import mergeMatchArt from "@/public/illustrations/merge-match.svg";
import negativeFinderArt from "@/public/illustrations/negative-finder.svg";
import privacyArt from "@/public/illustrations/privacy-local.svg";

export const metadata: Metadata = {
  title: "PPC Keyword Utilities Suite - Free Keyword Tools for Google Ads",
  description:
    "Free, no-login keyword tools for PPC specialists: match-type formatting, list merging, and negative-keyword mining. Every keyword stays in your browser.",
};

interface ToolCard {
  href: string;
  eyebrow: string;
  glyph: string;
  title: string;
  description: string;
  image: StaticImageData;
  /** Column span on the bento grid - deliberately uneven, see the grid below. */
  span: string;
}

const TOOLS: ToolCard[] = [
  {
    href: "/keyword-match-type",
    eyebrow: "Already have a list",
    glyph: '["]',
    title: "Keyword Match Type",
    description:
      "Format one list into Broad, Phrase, Exact, and BMM at once. Existing wrappers are stripped first, so re-running a formatted list stays clean.",
    image: matchTypeArt,
    span: "lg:col-span-3",
  },
  {
    href: "/keyword-merge-match",
    eyebrow: "Building from scratch",
    glyph: "A×B",
    title: "Keyword Merge & Match",
    description:
      "Combine modifier, core-term, and suffix lists into every permutation, then format the result.",
    image: mergeMatchArt,
    span: "lg:col-span-2",
  },
  {
    href: "/negative-keyword-finder",
    eyebrow: "Cleaning up live campaigns",
    glyph: "−",
    title: "Negative Keyword Finder",
    description:
      "Mine a search-terms report for the words draining spend, ranked by how often they appear.",
    image: negativeFinderArt,
    span: "lg:col-span-2",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6 sm:pt-16">
      {/*
        Split hero rather than centered stack: the copy carries the promise and
        the illustration carries the proof, so neither has to compete for the
        optical center. Falls back to a single column below lg.
      */}
      <section className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14">
        <div className="max-w-2xl">
          <p
            className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-border bg-surface py-1.5 pl-2.5 pr-3.5 font-mono text-xs text-ink-muted shadow-raised"
            style={{ animationDelay: "40ms" }}
          >
            <ShieldIcon className="h-3.5 w-3.5 text-signal" />
            Runs entirely in your browser
          </p>
          {/*
            `Ads-Editor-ready` is held together with `whitespace-nowrap`: its
            internal hyphens are break opportunities, and without this the
            heading splits as "Get Ads-" / "Editor-ready output." The break
            then falls at the sentence boundary, where it belongs.
          */}
          <h1 className="animate-fade-up mt-5 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            Paste a list.{" "}
            <span className="text-signal">
              Get <span className="whitespace-nowrap">Ads-Editor-ready</span>{" "}
              output.
            </span>
          </h1>
          <p
            className="animate-fade-up mt-4 max-w-[60ch] text-lg leading-relaxed text-ink-muted"
            style={{ animationDelay: "100ms" }}
          >
            Free, no-login keyword tools for PPC specialists - match-type
            formatting, list merging, and negative-keyword mining. Every keyword
            stays in your browser; nothing is ever uploaded to a server.
          </p>
          <div
            className="animate-fade-up mt-8 flex flex-wrap items-center gap-3"
            style={{ animationDelay: "160ms" }}
          >
            <Link
              href="/keyword-match-type"
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-signal px-5 text-sm font-medium text-white shadow-raised transition-[background-color,transform,box-shadow] duration-200 ease-out hover:bg-signal-strong hover:shadow-lifted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-paper active:scale-[0.96]"
            >
              Format a keyword list
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <Link
              href="/negative-keyword-finder"
              className="inline-flex min-h-11 items-center rounded-md border border-border-strong bg-surface px-5 text-sm font-medium text-ink transition-[background-color,transform] duration-200 ease-out hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-paper active:scale-[0.96]"
            >
              Mine a search-terms report
            </Link>
          </div>
        </div>

        <div
          className="animate-fade-up relative"
          style={{ animationDelay: "220ms" }}
        >
          <Image
            src={heroWorkflow}
            alt="A pasted list of 1,284 keywords fanning out into four output cards - Broad, Phrase, Exact and BMM - with a note that zero bytes were uploaded."
            priority
            className="img-edge w-full rounded-2xl shadow-lifted"
            sizes="(min-width: 1024px) 44vw, 100vw"
          />
        </div>
      </section>

      {/*
        Uneven 5-column bento instead of three identical thirds: the widths
        encode which tool most people land on first, and the fourth tile spends
        the leftover span on the privacy claim rather than padding the row out.
      */}
      <section className="mt-28 sm:mt-40">
        {/*
          Kept for document structure but not shown: a visible "Three tools"
          eyebrow is a label that describes the layout rather than saying
          anything, and the tiles below are already self-evident.
        */}
        <h2 className="sr-only">Tools in this suite</h2>
        {/*
          Gapless bento. Spans are 3+2 then 2+3 across five columns, so both
          rows fill exactly; `grid-flow-dense` backfills if a span ever changes.
          Tiles stretch to a shared row height and each preview panel takes the
          slack via `flex-1`, so equalising heights never opens a dead band
          between a tile's copy and its artwork.
        */}
        <div className="animate-stagger grid grid-flow-dense gap-5 lg:grid-cols-5">
          {TOOLS.map((tool, index) => (
            <Link
              key={tool.href}
              href={tool.href}
              style={{ "--index": index } as CSSProperties}
              className={`group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-raised transition-[border-color,box-shadow,transform] duration-200 ease-out hover:border-border-strong hover:shadow-lifted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-paper active:scale-[0.99] ${tool.span}`}
            >
              <div className="flex flex-col gap-2.5 p-6">
                <span className="flex items-center gap-2.5 font-mono text-xs text-ink-faint">
                  <span aria-hidden="true" className="text-signal">
                    {tool.glyph}
                  </span>
                  {tool.eyebrow}
                </span>
                <h3 className="font-display text-lg font-semibold text-ink">
                  {tool.title}
                </h3>
                <p className="text-sm leading-relaxed text-ink-muted">
                  {tool.description}
                </p>
                <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-signal">
                  Open tool
                  <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
                </span>
              </div>
              {/*
                Panel and artwork share the same white ground, so the letterbox
                `object-contain` leaves is invisible - the preview reads as one
                continuous surface at any height the row settles on.
              */}
              <div className="relative min-h-44 flex-1 overflow-hidden border-t border-border bg-surface">
                <Image
                  src={tool.image}
                  alt=""
                  fill
                  className="object-contain transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  sizes="(min-width: 1024px) 40vw, 100vw"
                />
              </div>
            </Link>
          ))}

          <div
            style={{ "--index": TOOLS.length } as CSSProperties}
            className="relative flex flex-col overflow-hidden rounded-2xl border border-signal/25 bg-signal-soft lg:col-span-3"
          >
            <div className="flex flex-col gap-2.5 p-6">
              <span className="flex items-center gap-2.5 font-mono text-xs text-signal-strong">
                <ShieldIcon className="h-4 w-4" />
                No account, no upload
              </span>
              <h3 className="font-display text-lg font-semibold text-ink">
                Client keyword data never leaves this tab
              </h3>
              <p className="max-w-[52ch] text-sm leading-relaxed text-ink-muted">
                Parsing, merging and formatting all run in your browser - on a
                Web Worker for large lists. There is no upload step to opt out
                of, because there is no server to upload to.
              </p>
            </div>
            {/* Panel ground matches this artwork's tinted background, same trick. */}
            <div className="relative min-h-44 flex-1 overflow-hidden border-t border-signal/20 bg-signal-soft">
              <Image
                src={privacyArt}
                alt=""
                fill
                className="object-contain"
                sizes="(min-width: 1024px) 58vw, 100vw"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
