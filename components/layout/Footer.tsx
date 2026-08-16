import Link from "next/link";

const TOOLS = [
  { href: "/keyword-match-type", label: "Keyword Match Type" },
  { href: "/keyword-merge-match", label: "Keyword Merge & Match" },
  { href: "/negative-keyword-finder", label: "Negative Keyword Finder" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:justify-between sm:px-6">
        <div className="max-w-sm">
          <p className="font-display text-sm font-semibold text-ink">
            PPC Keyword Utilities Suite
          </p>
          <p className="mt-2 text-sm text-ink-muted">
            Free, browser-based keyword tools for PPC specialists. Every list
            you paste or upload is processed entirely on your device - nothing
            is ever sent to a server.
          </p>
          <p className="mt-3 text-xs text-ink-faint">
            Built by{" "}
            <a
              href="https://app.ppcexpert.pro/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-ink-muted underline underline-offset-2 hover:text-signal"
            >
              PPC Expert
            </a>{" "}
            - search engine strategy for local service businesses.
          </p>
        </div>
        <nav aria-label="Tools" className="flex flex-col items-start text-sm">
          {TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="-mx-2 flex min-h-10 items-center rounded-md px-2 text-ink-muted transition-colors duration-200 ease-out hover:text-signal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              {tool.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
