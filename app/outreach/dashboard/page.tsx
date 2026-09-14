import Link from "next/link";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageShell, PageHeader } from "@/components/outreach/PageShell";
import {
  getMailboxHealthRows,
  getCampaignPerformanceRows,
  getWorkerHeartbeats,
  type HeartbeatStatus,
} from "@/lib/outreach/dashboard/queries";

export const metadata = { title: "Dashboard | PPC Keyword Utilities Suite" };

// See app/outreach/mailboxes/page.tsx for why this is required.
export const dynamic = "force-dynamic";

/** Gmail starts filtering a sender well before this, so it's a warning, not a limit. */
const BOUNCE_WARN_RATE = 0.02;

function formatPercent(value: number | null): string {
  return value === null ? "—" : `${(value * 100).toFixed(1)}%`;
}

function formatAge(secondsAgo: number | null): string {
  if (secondsAgo === null) return "never run";
  if (secondsAgo < 60) return `${secondsAgo}s ago`;
  return `${Math.round(secondsAgo / 60)}m ago`;
}

function ProcessCard({ status }: { status: HeartbeatStatus }) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-surface p-4 shadow-raised">
      <span className="relative flex h-2.5 w-2.5 flex-none" aria-hidden="true">
        {/* A halo rather than a ping animation: the axe sweep waits for every
            animation on the page to finish, and an infinite one never does. */}
        <span
          className={`absolute -inset-1 rounded-full ${status.healthy ? "bg-signal/15" : "bg-danger/15"}`}
        />
        <span
          className={`relative h-2.5 w-2.5 rounded-full ${status.healthy ? "bg-signal" : "bg-danger"}`}
        />
      </span>
      <div className="min-w-0">
        <p className="font-medium capitalize text-ink">{status.process}</p>
        <p data-numeric className="font-mono text-xs text-ink-faint">
          {status.healthy ? formatAge(status.secondsAgo) : `stalled — ${formatAge(status.secondsAgo)}`}
        </p>
      </div>
    </div>
  );
}

/** Horizontal fill for today's volume against the mailbox's cap. */
function CapacityMeter({ sent, cap }: { sent: number; cap: number }) {
  const ratio = cap > 0 ? Math.min(sent / cap, 1) : 0;

  return (
    <div className="flex items-center gap-2.5">
      <span className="h-1.5 w-16 flex-none overflow-hidden rounded-full bg-paper">
        <span
          className={`block h-full rounded-full ${ratio >= 1 ? "bg-flag" : "bg-signal"}`}
          style={{ width: `${ratio * 100}%` }}
        />
      </span>
      <span data-numeric className="font-mono text-xs text-ink-muted">
        {sent}/{cap}
      </span>
    </div>
  );
}

const TH = "px-4 py-2.5 font-mono text-[0.625rem] font-medium uppercase tracking-wider text-ink-faint";
const TD = "px-4 py-3";

export default async function DashboardPage() {
  const [mailboxRows, campaignRows, heartbeats] = await Promise.all([
    getMailboxHealthRows(),
    getCampaignPerformanceRows(),
    getWorkerHeartbeats(),
  ]);

  return (
    <PageShell width="wide">
      <PageHeader
        title="Deliverability"
        description="Sending health across every mailbox and campaign. If the worker isn't running, nothing below moves."
      />

      <section className="mb-10">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Process health
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ProcessCard status={heartbeats.worker} />
          <ProcessCard status={heartbeats.poller} />
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Mailbox health
        </h2>
        {mailboxRows.length === 0 ? (
          <EmptyState
            title="No mailboxes connected"
            description="A campaign can't send until at least one healthy mailbox is attached to it."
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-raised">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className={TH}>Mailbox</th>
                  <th className={TH}>Provider</th>
                  <th className={TH}>Health</th>
                  <th className={TH}>Sent today</th>
                  <th className={TH}>Bounce rate</th>
                </tr>
              </thead>
              <tbody>
                {mailboxRows.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className={TD}>
                      <span className="font-medium text-ink">{row.fromName}</span>
                      {/* Gmail-connected mailboxes default their display name to
                          the address, and printing it twice reads as a bug. */}
                      {row.fromName !== row.fromEmail && (
                        <span className="block text-xs text-ink-faint">{row.fromEmail}</span>
                      )}
                    </td>
                    <td className={`${TD} font-mono text-xs text-ink-muted`}>
                      {row.provider === "gmail_oauth" ? "Google" : "SMTP"}
                    </td>
                    <td className={TD}>
                      <StatusBadge status={row.health} />
                    </td>
                    <td className={TD}>
                      <CapacityMeter sent={row.sentToday} cap={row.dailyCap} />
                    </td>
                    <td className={TD}>
                      {row.bounceRate ? (
                        <span
                          data-numeric
                          className={`font-mono text-xs ${row.bounceRate.rate >= BOUNCE_WARN_RATE ? "font-semibold text-danger" : "text-ink-muted"}`}
                        >
                          {formatPercent(row.bounceRate.rate)}
                          <span className="ml-1 text-ink-faint">n={row.bounceRate.sampleSize}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-ink-faint">not enough data</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Campaign performance
        </h2>
        {campaignRows.length === 0 ? (
          <EmptyState title="No campaigns yet" description="Create a campaign to see performance here." />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-raised">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className={TH}>Campaign</th>
                  <th className={TH}>Status</th>
                  <th className={TH}>Enrolled</th>
                  <th className={TH}>In flight</th>
                  <th className={TH}>Replied</th>
                  <th className={TH}>Bounced</th>
                  <th className={TH}>Completed</th>
                  <th className={TH}>Reply rate</th>
                </tr>
              </thead>
              <tbody>
                {campaignRows.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className={TD}>
                      <Link
                        href={`/outreach/campaigns/${row.id}`}
                        className="font-medium text-ink underline decoration-border-strong underline-offset-4 transition-colors duration-200 ease-out hover:decoration-signal"
                      >
                        {row.name}
                      </Link>
                    </td>
                    <td className={TD}>
                      <StatusBadge status={row.status} />
                    </td>
                    <td data-numeric className={`${TD} text-ink-muted`}>{row.enrolled}</td>
                    <td data-numeric className={`${TD} text-ink-muted`}>{row.active}</td>
                    <td data-numeric className={`${TD} font-semibold text-signal-strong`}>{row.replied}</td>
                    <td data-numeric className={`${TD} ${row.bounced > 0 ? "text-danger" : "text-ink-muted"}`}>
                      {row.bounced}
                    </td>
                    <td data-numeric className={`${TD} text-ink-muted`}>{row.completed}</td>
                    <td data-numeric className={`${TD} font-medium text-ink`}>{formatPercent(row.replyRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </PageShell>
  );
}
