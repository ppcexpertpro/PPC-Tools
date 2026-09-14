import Link from "next/link";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SpotlightLink } from "@/components/shared/SpotlightLink";
import { PageShell, PageHeader } from "@/components/outreach/PageShell";
import { getCampaignPerformanceRows } from "@/lib/outreach/dashboard/queries";

export const metadata = { title: "Outreach | PPC Keyword Utilities Suite" };

// See app/outreach/mailboxes/page.tsx for why this is required.
export const dynamic = "force-dynamic";

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="font-mono text-[0.625rem] uppercase tracking-wider text-ink-faint">{label}</dt>
      <dd data-numeric className="mt-0.5 font-display text-lg font-semibold text-ink">
        {value}
      </dd>
    </div>
  );
}

export default async function OutreachCampaignsPage() {
  // The dashboard's own query, reused rather than re-counting here: a campaign
  // list that shows only a name and a status is a list you have to click every
  // row of to learn anything from.
  const rows = await getCampaignPerformanceRows();

  return (
    <PageShell width="wide">
      <PageHeader
        title="Campaigns"
        description="Every sequence, and how it's performing. Reply rate counts only contacts that finished the sequence one way or another."
        actions={
          <Link
            href="/outreach/campaigns/new"
            className="inline-flex min-h-11 items-center rounded-md bg-signal px-4 text-sm font-medium text-white shadow-raised transition-[background-color,transform] duration-200 ease-out hover:bg-signal-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-paper active:scale-[0.96]"
          >
            New campaign
          </Link>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No campaigns yet"
          description="Connect a mailbox first, then build a sequence. Nothing sends until you start a campaign explicitly."
        />
      ) : (
        <ul className="animate-stagger flex flex-col gap-3">
          {rows.map((campaign, index) => (
            <li key={campaign.id} style={{ "--index": index } as React.CSSProperties}>
              <SpotlightLink href={`/outreach/campaigns/${campaign.id}`} className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-display text-lg font-semibold tracking-[-0.01em] text-ink">
                    {campaign.name}
                  </p>
                  <StatusBadge status={campaign.status} />
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-5">
                  <Metric label="Enrolled" value={campaign.enrolled} />
                  <Metric label="In flight" value={campaign.active} />
                  <Metric label="Replied" value={campaign.replied} />
                  <Metric label="Bounced" value={campaign.bounced} />
                  <Metric
                    label="Reply rate"
                    value={campaign.replyRate === null ? "—" : `${(campaign.replyRate * 100).toFixed(1)}%`}
                  />
                </dl>
              </SpotlightLink>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
