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
            you paste or upload is processed entirely on your device — nothing
            is ever sent to a server.
          </p>
        </div>
        <nav aria-label="Tools" className="flex flex-col gap-2 text-sm">
          {TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="text-ink-muted hover:text-signal"
            >
              {tool.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
