import type { ReactNode } from "react";
import { ShieldIcon } from "@/components/shared/icons";

export interface LegalPageProps {
  title: string;
  /** Human-readable date, e.g. "16 August 2026". */
  updatedOn: string;
  /**
   * The whole document in two or three sentences. Legal pages get skimmed,
   * not read, so the honest summary goes first and at full contrast rather
   * than being buried under boilerplate the reader has to wade through.
   */
  summary: ReactNode;
  children: ReactNode;
}

export function LegalPage({
  title,
  updatedOn,
  summary,
  children,
}: LegalPageProps) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto max-w-2xl px-4 py-12 outline-none sm:px-6 sm:py-16"
    >
      <p className="animate-fade-up font-mono text-xs text-ink-faint">
        Last updated {updatedOn}
      </p>
      <h1
        className="animate-fade-up mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl"
        style={{ animationDelay: "60ms" }}
      >
        {title}
      </h1>

      <div
        className="animate-fade-up mt-8 rounded-2xl border border-signal/25 bg-signal-soft p-6"
        style={{ animationDelay: "120ms" }}
      >
        <p className="flex items-center gap-2.5 font-mono text-xs text-signal-strong">
          <ShieldIcon className="h-4 w-4" />
          The short version
        </p>
        <div className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-ink-muted">
          {summary}
        </div>
      </div>

      <div
        className="animate-fade-up mt-12 flex flex-col gap-10"
        style={{ animationDelay: "180ms" }}
      >
        {children}
      </div>
    </main>
  );
}

export interface LegalSectionProps {
  heading: string;
  children: ReactNode;
}

export function LegalSection({ heading, children }: LegalSectionProps) {
  return (
    <section>
      <h2 className="font-display text-lg font-semibold text-ink">{heading}</h2>
      {/*
        62ch rather than the container's full width: the masthead and summary
        card can run wide because they're skimmed, but continuous prose past
        ~65 characters costs the reader the line return.
      */}
      <div className="mt-3 flex max-w-[62ch] flex-col gap-3 leading-relaxed text-ink-muted">
        {children}
      </div>
    </section>
  );
}
