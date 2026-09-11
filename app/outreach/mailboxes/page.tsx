import { db } from "@/db/client";
import { mailboxes } from "@/db/schema";
import { MailboxForm } from "./MailboxForm";

export const metadata = { title: "Mailboxes | PPC Keyword Utilities Suite" };

// Reads live DB state via a raw Postgres client, which Next's static
// analysis can't see (it only recognizes `fetch()` and request-time APIs as
// dynamic signals). Without this, the mailbox list gets baked in at build
// time and never updates. See caching-without-cache-components.md.
export const dynamic = "force-dynamic";

export default async function MailboxesPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; googleError?: string }>;
}) {
  const { connected, googleError } = await searchParams;

  const rows = await db
    .select({
      id: mailboxes.id,
      provider: mailboxes.provider,
      fromName: mailboxes.fromName,
      fromEmail: mailboxes.fromEmail,
      dailyCap: mailboxes.dailyCap,
      health: mailboxes.health,
    })
    .from(mailboxes);

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-2xl px-4 py-12 outline-none sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink">Mailboxes</h1>

      {connected && (
        <p className="mt-4 rounded-md border border-signal/30 bg-signal-soft px-4 py-3 text-sm text-signal-strong">
          Mailbox connected via Google.
        </p>
      )}
      {googleError && (
        <p className="mt-4 rounded-md border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          {googleError}
        </p>
      )}

      <ul className="mt-6 flex flex-col gap-2">
        {rows.map((mailbox) => (
          <li key={mailbox.id} className="rounded-2xl border border-border bg-surface p-4 text-sm">
            <span className="font-medium text-ink">{mailbox.fromName}</span>{" "}
            <span className="text-ink-muted">&lt;{mailbox.fromEmail}&gt;</span>
            <span className="ml-2 font-mono text-xs text-ink-faint">
              {mailbox.provider === "gmail_oauth" ? "Google" : "SMTP"} - {mailbox.dailyCap}/day - {mailbox.health}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-col gap-6 rounded-2xl border border-border bg-surface p-6">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Connect a mailbox</h2>
          <a
            href="/api/outreach/mailboxes/google/start"
            className="mt-3 inline-flex min-h-11 items-center rounded-md border border-border-strong bg-surface px-4 text-sm font-medium text-ink shadow-raised hover:bg-paper"
          >
            Connect with Google
          </a>
        </div>
        <div className="border-t border-border pt-6">
          <h3 className="font-display text-sm font-semibold text-ink">Or connect via SMTP/IMAP</h3>
          <div className="mt-4">
            <MailboxForm />
          </div>
        </div>
      </div>
    </main>
  );
}
