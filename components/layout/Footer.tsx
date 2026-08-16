import Link from "next/link";

const TOOLS = [
  { href: "/keyword-match-type", label: "Keyword Match Type" },
  { href: "/keyword-merge-match", label: "Keyword Merge & Match" },
  { href: "/negative-keyword-finder", label: "Negative Keyword Finder" },
];

const LEGAL = [
  { href: "/privacy", label: "Privacy policy" },
  { href: "/terms", label: "Terms of use" },
];

// Shared by both link columns: the negative inset plus 40px minimum height
// give each link a touch target without the columns visibly indenting.
const LINK_CLASS =
  "-mx-2 flex min-h-10 items-center rounded-md px-2 text-ink-muted transition-colors duration-200 ease-out hover:text-signal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

const COLUMN_HEADING_CLASS =
  "mb-1 font-mono text-xs uppercase tracking-wider text-ink-faint";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between sm:gap-12">
          <div className="max-w-sm">
            <p className="font-display text-sm font-semibold text-ink">
              PPC Keyword Utilities Suite
            </p>
            <p className="mt-2 text-sm text-ink-muted">
              Free, browser-based keyword tools for PPC specialists. Every list
              you paste or upload is processed entirely on your device - nothing
              is ever sent to a server.
            </p>
          </div>

          {/*
            Two short columns rather than one long list: the tools are the
            navigation people came for, and burying them among legal links
            makes both harder to scan.
          */}
          <div className="flex gap-12 text-sm sm:gap-16">
            <nav aria-label="Tools" className="flex flex-col items-start">
              <h2 className={COLUMN_HEADING_CLASS}>Tools</h2>
              {TOOLS.map((tool) => (
                <Link key={tool.href} href={tool.href} className={LINK_CLASS}>
                  {tool.label}
                </Link>
              ))}
            </nav>

            <nav aria-label="Legal" className="flex flex-col items-start">
              <h2 className={COLUMN_HEADING_CLASS}>Legal</h2>
              {LEGAL.map((item) => (
                <Link key={item.href} href={item.href} className={LINK_CLASS}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/*
          Attribution and copyright sit below a rule rather than inside the
          brand column: they are the smallest type on the page and were
          competing with the privacy promise directly above them.
        */}
        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            Built by{" "}
            <a
              href="https://app.ppcexpert.pro/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-ink-muted underline underline-offset-2 transition-colors duration-200 ease-out hover:text-signal"
            >
              PPC Expert
            </a>{" "}
            - search engine strategy for local service businesses.
          </p>
          <p>
            &copy; {new Date().getFullYear()} PPC Keyword Utilities Suite. Not
            affiliated with Google or Microsoft.
          </p>
        </div>
      </div>
    </footer>
  );
}
