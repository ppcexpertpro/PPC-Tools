import Link from "next/link";
import { asc, eq, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { campaigns, enrollments, sequenceSteps } from "@/db/schema";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageShell, PageHeader } from "@/components/outreach/PageShell";
import { CampaignStartButton } from "./CampaignStartButton";
import { CampaignPauseResumeButton } from "./CampaignPauseResumeButton";
import { ImportContactsForm } from "./ImportContactsForm";
import { StatusPoller } from "./StatusPoller";

// Explicit even though the [id] segment already forces dynamic rendering by
// default (no generateStaticParams here) — see app/outreach/mailboxes/page.tsx.
export const dynamic = "force-dynamic";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [campaign] = await db.select({ name: campaigns.name }).from(campaigns).where(eq(campaigns.id, id));

  return { title: campaign ? `${campaign.name} | Outreach` : "Campaign | Outreach" };
}

export default async function CampaignStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
  if (!campaign) notFound();

  const steps = await db
    .select({
      stepOrder: sequenceSteps.stepOrder,
      subjectTemplate: sequenceSteps.subjectTemplate,
      delayDays: sequenceSteps.delayDays,
    })
    .from(sequenceSteps)
    .where(eq(sequenceSteps.campaignId, id))
    .orderBy(asc(sequenceSteps.stepOrder));

  const statusCounts = await db
    .select({ status: enrollments.status, count: sql<number>`count(*)::int` })
    .from(enrollments)
    .where(eq(enrollments.campaignId, id))
    .groupBy(enrollments.status);

  const total = statusCounts.reduce((sum, row) => sum + row.count, 0);
  const sendDays = campaign.businessDays.map((day) => DAYS[day]).join(", ");

  return (
    <PageShell>
      <StatusPoller active={campaign.status === "active"} />

      <PageHeader
        back={{ href: "/outreach", label: "All campaigns" }}
        eyebrow={<StatusBadge status={campaign.status} />}
        title={campaign.name}
        actions={
          <>
            {campaign.status === "draft" && (
              <Link
                href={`/outreach/campaigns/${campaign.id}/edit`}
                className="inline-flex min-h-11 items-center rounded-md border border-border-strong bg-surface px-4 text-sm font-medium text-ink shadow-raised transition-[background-color,transform] duration-200 ease-out hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-paper active:scale-[0.96]"
              >
                Edit
              </Link>
            )}
            {(campaign.status === "active" || campaign.status === "paused") && (
              <CampaignPauseResumeButton campaignId={campaign.id} status={campaign.status} />
            )}
            <Link
              href={`/outreach/campaigns/${campaign.id}/enrollments`}
              className="inline-flex min-h-11 items-center rounded-md border border-border-strong bg-surface px-4 text-sm font-medium text-ink shadow-raised transition-[background-color,transform] duration-200 ease-out hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-paper active:scale-[0.96]"
            >
              Contacts
            </Link>
          </>
        }
      />

      {/* Sending window surfaced on the page itself: a campaign scheduling its
          first send four days out is correct behaviour when today isn't one of
          these days, but it reads as a broken campaign if the schedule is only
          visible on the edit form. */}
      <p className="-mt-4 mb-8 font-mono text-xs text-ink-faint">
        Sends {sendDays} · {campaign.businessHoursStart}:00–{campaign.businessHoursEnd}:00 recipient
        local · max {campaign.domainThrottleLimit}/domain per 24h
      </p>

      <section className="mb-10">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Sequence
        </h2>
        {/* No entry animation on this page: StatusPoller calls router.refresh()
            every 5s while a campaign is active, and anything that re-triggers
            a keyframe on re-render would flicker the whole list on each poll.
            Stable keys should prevent a remount, but the cost of being wrong
            here is a page that visibly twitches while you watch it. */}
        <ol className="flex flex-col">
          {steps.map((step, index) => (
            <li key={step.stepOrder} className="relative flex gap-4 pb-4 last:pb-0">
              {/* Connector drawn behind the markers so the sequence reads as one
                  thread rather than as unrelated stacked cards. */}
              {index < steps.length - 1 && (
                <span aria-hidden="true" className="absolute left-[0.9375rem] top-8 h-full w-px bg-border" />
              )}
              <span
                data-numeric
                aria-hidden="true"
                className="relative z-1 flex h-8 w-8 flex-none items-center justify-center rounded-full border border-border bg-surface font-mono text-xs font-medium text-ink-muted shadow-raised"
              >
                {step.stepOrder}
              </span>
              <div className="min-w-0 flex-1 rounded-xl border border-border bg-surface p-4 shadow-raised">
                <p className="text-sm text-ink">{step.subjectTemplate}</p>
                <p className="mt-1.5 font-mono text-xs text-ink-faint">
                  {step.stepOrder === 1
                    ? "Sent first"
                    : `${step.delayDays}d after step ${step.stepOrder - 1}, if no reply`}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Contacts
        </h2>
        {total === 0 ? (
          <EmptyState
            title="No contacts imported yet"
            description="Upload a CSV below. Addresses already on the suppression list are skipped automatically."
          />
        ) : (
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {statusCounts.map((row) => (
              <div key={row.status} className="rounded-2xl border border-border bg-surface p-4 shadow-raised">
                <dt>
                  <StatusBadge status={row.status} />
                </dt>
                <dd
                  data-numeric
                  className="mt-2 font-display text-3xl font-semibold tracking-[-0.02em] text-ink"
                >
                  {row.count}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      {campaign.status === "draft" && (
        <div className="flex flex-col gap-8 rounded-2xl border border-border bg-surface p-6 shadow-raised">
          <section>
            <h2 className="font-display text-lg font-semibold text-ink">Import contacts</h2>
            <div className="mt-4">
              <ImportContactsForm campaignId={campaign.id} />
            </div>
          </section>
          <div className="border-t border-border pt-6">
            <h2 className="font-display text-lg font-semibold text-ink">Start sending</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Runs the preflight checks — authentication records, postal address, merge fields and the
              unsubscribe token — then schedules every pending contact.
            </p>
            <CampaignStartButton campaignId={campaign.id} />
          </div>
        </div>
      )}
    </PageShell>
  );
}
