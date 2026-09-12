import Link from "next/link";
import { getMailboxHealthRows, getCampaignPerformanceRows, getWorkerHeartbeats } from "@/lib/outreach/dashboard/queries";

export const metadata = { title: "Dashboard | PPC Keyword Utilities Suite" };

// See app/outreach/mailboxes/page.tsx for why this is required.
export const dynamic = "force-dynamic";

function formatPercent(value: number | null): string {
  return value === null ? "-" : `${(value * 100).toFixed(1)}%`;
}

function formatAge(secondsAgo: number | null): string {
  if (secondsAgo === null) return "never run";
  if (secondsAgo < 60) return `${secondsAgo}s ago`;
  return `${Math.round(secondsAgo / 60)}m ago`;
}

export default async function DashboardPage() {
  const [mailboxRows, campaignRows, heartbeats] = await Promise.all([
    getMailboxHealthRows(),
    getCampaignPerformanceRows(),
    getWorkerHeartbeats(),
  ]);

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-5xl px-4 py-12 outline-none sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink">Deliverability dashboard</h1>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-ink">Process health</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[heartbeats.worker, heartbeats.poller].map((status) => (
            <div key={status.process} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
              <span
                className={`h-2.5 w-2.5 flex-none rounded-full ${status.healthy ? "bg-signal" : "bg-danger"}`}
                aria-hidden="true"
              />
              <div>
                <p className="font-medium capitalize text-ink">{status.process}</p>
                <p className="font-mono text-xs text-ink-faint">{formatAge(status.secondsAgo)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg font-semibold text-ink">Mailbox health</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-4 py-3">Mailbox</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Health</th>
                <th className="px-4 py-3">Sent today / cap</th>
                <th className="px-4 py-3">Bounce rate</th>
              </tr>
            </thead>
            <tbody>
              {mailboxRows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    {row.fromName} <span className="text-ink-muted">&lt;{row.fromEmail}&gt;</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{row.provider === "gmail_oauth" ? "Google" : "SMTP"}</td>
                  <td className="px-4 py-3 font-mono text-xs uppercase">{row.health}</td>
                  <td className="px-4 py-3">
                    {row.sentToday} / {row.dailyCap}
                  </td>
                  <td className="px-4 py-3">
                    {row.bounceRate ? `${formatPercent(row.bounceRate.rate)} (${row.bounceRate.sampleSize})` : "not enough data yet"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg font-semibold text-ink">Campaign performance</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Enrolled</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3">Replied</th>
                <th className="px-4 py-3">Bounced</th>
                <th className="px-4 py-3">Completed</th>
                <th className="px-4 py-3">Reply rate</th>
              </tr>
            </thead>
            <tbody>
              {campaignRows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/outreach/campaigns/${row.id}`} className="text-signal underline underline-offset-2">
                      {row.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs uppercase">{row.status}</td>
                  <td className="px-4 py-3">{row.enrolled}</td>
                  <td className="px-4 py-3">{row.active}</td>
                  <td className="px-4 py-3">{row.replied}</td>
                  <td className="px-4 py-3">{row.bounced}</td>
                  <td className="px-4 py-3">{row.completed}</td>
                  <td className="px-4 py-3">{formatPercent(row.replyRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
