import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { campaigns } from "@/db/schema";

export const metadata = { title: "Outreach | PPC Keyword Utilities Suite" };

// See app/outreach/mailboxes/page.tsx for why this is required.
export const dynamic = "force-dynamic";

export default async function OutreachDashboardPage() {
  const rows = await db.select().from(campaigns).orderBy(desc(campaigns.createdAt));

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-4xl px-4 py-12 outline-none sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-ink">Outreach campaigns</h1>
        <div className="flex items-center gap-3">
          <Link href="/outreach/dashboard" className="text-sm text-signal underline underline-offset-2">
            Dashboard
          </Link>
          <Link
            href="/outreach/campaigns/new"
            className="inline-flex min-h-11 items-center rounded-md bg-signal px-4 text-sm font-medium text-white shadow-raised hover:bg-signal-strong"
          >
            New campaign
          </Link>
        </div>
      </div>

      <ul className="mt-8 flex flex-col gap-3">
        {rows.length === 0 && (
          <li className="rounded-2xl border border-border bg-surface p-6 text-sm text-ink-muted">
            No campaigns yet.{" "}
            <Link href="/outreach/mailboxes" className="text-signal underline underline-offset-2">
              Connect a mailbox
            </Link>
            , then create your first campaign.
          </li>
        )}
        {rows.map((campaign) => (
          <li key={campaign.id}>
            <Link
              href={`/outreach/campaigns/${campaign.id}`}
              className="flex items-center justify-between rounded-2xl border border-border bg-surface p-5 shadow-raised transition-colors hover:border-border-strong"
            >
              <div>
                <p className="font-display text-lg font-semibold text-ink">{campaign.name}</p>
                <p className="mt-1 font-mono text-xs uppercase tracking-wide text-ink-faint">{campaign.status}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
