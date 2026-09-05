import { asc, eq, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { campaigns, enrollments, sequenceSteps } from "@/db/schema";
import { CampaignStartButton } from "./CampaignStartButton";
import { ImportContactsForm } from "./ImportContactsForm";
import { StatusPoller } from "./StatusPoller";

// Explicit even though the [id] segment already forces dynamic rendering by
// default (no generateStaticParams here) — see app/outreach/mailboxes/page.tsx.
export const dynamic = "force-dynamic";

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

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-12 outline-none sm:px-6">
      <StatusPoller active={campaign.status === "active"} />
      <p className="font-mono text-xs uppercase tracking-wide text-ink-faint">{campaign.status}</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-ink">{campaign.name}</h1>

      <ol className="mt-6 flex flex-col gap-2">
        {steps.map((step) => (
          <li key={step.stepOrder} className="rounded-2xl border border-border bg-surface p-4 text-sm">
            <span className="font-mono text-xs text-ink-faint">
              Step {step.stepOrder}
              {step.stepOrder > 1 && ` - ${step.delayDays}d after step ${step.stepOrder - 1}`}
            </span>
            <p className="mt-1 text-ink">{step.subjectTemplate}</p>
          </li>
        ))}
      </ol>

      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {statusCounts.map((row) => (
          <div key={row.status} className="rounded-2xl border border-border bg-surface p-4">
            <dt className="font-mono text-xs uppercase tracking-wide text-ink-faint">{row.status}</dt>
            <dd className="mt-1 font-display text-2xl font-semibold text-ink">{row.count}</dd>
          </div>
        ))}
        {statusCounts.length === 0 && (
          <p className="col-span-full text-sm text-ink-muted">No contacts imported yet.</p>
        )}
      </dl>

      {campaign.status === "draft" && (
        <div className="mt-10 flex flex-col gap-8">
          <section>
            <h2 className="font-display text-lg font-semibold text-ink">Import contacts</h2>
            <div className="mt-4">
              <ImportContactsForm campaignId={campaign.id} />
            </div>
          </section>
          <CampaignStartButton campaignId={campaign.id} />
        </div>
      )}
    </main>
  );
}
