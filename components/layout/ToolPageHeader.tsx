import Image, { type StaticImageData } from "next/image";
import type { ReactNode } from "react";
import { ChevronDownIcon } from "@/components/shared/icons";

export interface ToolPageHeaderProps {
  title: ReactNode;
  description: ReactNode;
  /** Label on the collapsed explainer, e.g. "How match types work". */
  explainerSummary: string;
  explainerContent: ReactNode;
  illustration: StaticImageData;
}

/**
 * Shared masthead for the three tool pages - previously duplicated verbatim in
 * each one.
 *
 * The illustration is capped at ~13rem and only shown from `lg` up so it sits
 * beside the copy rather than above the fold-line: UX-DESIGN's "get in, get
 * your output" principle means the primary input must not get pushed down the
 * page to make room for decoration.
 */
export function ToolPageHeader({
  title,
  description,
  explainerSummary,
  explainerContent,
  illustration,
}: ToolPageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-10">
      <div className="max-w-3xl">
        <h1 className="animate-fade-up font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {title}
        </h1>
        <p
          className="animate-fade-up mt-3 max-w-[62ch] text-lg leading-relaxed text-ink-muted"
          style={{ animationDelay: "80ms" }}
        >
          {description}
        </p>

        {/*
          `[&_svg]:open:rotate-180` rotates the caret with the disclosure
          instead of swapping one glyph for another, so opening and closing
          read as the same gesture in reverse.
        */}
        <details
          className="animate-fade-up group mt-5 rounded-xl border border-border bg-surface text-sm text-ink-muted shadow-raised"
          style={{ animationDelay: "140ms" }}
        >
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 font-medium text-ink [&::-webkit-details-marker]:hidden">
            {explainerSummary}
            <ChevronDownIcon className="h-4 w-4 shrink-0 text-ink-faint transition-transform duration-200 ease-out group-open:rotate-180" />
          </summary>
          <div className="flex flex-col gap-2 px-4 pb-4">{explainerContent}</div>
        </details>
      </div>

      <Image
        src={illustration}
        alt=""
        className="img-edge hidden w-52 shrink-0 rounded-xl shadow-raised lg:block"
        sizes="13rem"
      />
    </div>
  );
}
