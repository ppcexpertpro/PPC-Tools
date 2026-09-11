import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db, runAtomic } from "@/db/client";
import { campaigns, campaignMailboxes, mailboxes, contacts, enrollments, sequenceSteps } from "@/db/schema";
import { runPoolPreflight } from "@/lib/outreach/preflight/pool";
import { scheduleCampaignStart, type PoolMailbox } from "@/lib/outreach/campaigns/start";
import { countSentByMailboxToday } from "@/lib/outreach/scheduler/sendCounts";

export async function POST(_request: Request, ctx: RouteContext<"/api/outreach/campaigns/[id]/start">) {
  const { id } = await ctx.params;

  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  if (campaign.status !== "draft") {
    return NextResponse.json({ error: `Campaign is already ${campaign.status}` }, { status: 409 });
  }

  const pool = await db
    .select({
      id: mailboxes.id,
      fromEmail: mailboxes.fromEmail,
      dailyCap: mailboxes.dailyCap,
      rampStartedAt: mailboxes.rampStartedAt,
      health: mailboxes.health,
    })
    .from(campaignMailboxes)
    .innerJoin(mailboxes, eq(mailboxes.id, campaignMailboxes.mailboxId))
    .where(eq(campaignMailboxes.campaignId, id));

  const healthyPool = pool.filter((m) => m.health === "healthy");
  if (healthyPool.length === 0) {
    return NextResponse.json({ error: "No healthy mailboxes in this campaign's pool" }, { status: 422 });
  }

  const steps = await db
    .select({ subjectTemplate: sequenceSteps.subjectTemplate, bodyTemplate: sequenceSteps.bodyTemplate })
    .from(sequenceSteps)
    .where(eq(sequenceSteps.campaignId, id))
    .orderBy(asc(sequenceSteps.stepOrder));

  if (steps.length === 0) {
    return NextResponse.json({ error: "Campaign has no sequence steps" }, { status: 422 });
  }

  const pending = await db
    .select({
      enrollmentId: enrollments.id,
      contactId: contacts.id,
      email: contacts.email,
      fields: contacts.fields,
      timezone: contacts.timezone,
    })
    .from(enrollments)
    .innerJoin(contacts, eq(contacts.id, enrollments.contactId))
    .where(and(eq(enrollments.campaignId, id), eq(enrollments.status, "pending")));

  if (pending.length === 0) {
    return NextResponse.json({ error: "No pending contacts to enroll" }, { status: 422 });
  }

  const senderDomains = [...new Set(healthyPool.map((m) => m.fromEmail.split("@")[1] ?? ""))];
  const preflight = await runPoolPreflight({
    senderDomains,
    dkimSelector: "default",
    postalAddress: campaign.postalAddress,
    templates: steps.flatMap((step) => [step.subjectTemplate, step.bodyTemplate]),
    contacts: pending.map((p) => ({ id: p.contactId, email: p.email, fields: p.fields })),
  });

  if (!preflight.pass) {
    return NextResponse.json({ error: "Preflight checks failed", preflight }, { status: 422 });
  }

  const now = new Date();
  const mailboxesForScheduling: PoolMailbox[] = await Promise.all(
    healthyPool.map(async (m) => ({
      id: m.id,
      dailyCap: m.dailyCap,
      rampStartedAt: m.rampStartedAt,
      alreadySentToday: await countSentByMailboxToday(m.id, now),
    })),
  );

  const scheduled = scheduleCampaignStart({
    now,
    baseIntervalSeconds: campaign.baseIntervalSeconds,
    businessHours: {
      startHour: campaign.businessHoursStart,
      endHour: campaign.businessHoursEnd,
      days: campaign.businessDays,
    },
    mailboxes: mailboxesForScheduling,
    domainThrottleLimit: campaign.domainThrottleLimit,
    enrollments: pending.map((p) => ({ id: p.enrollmentId, email: p.email, timezone: p.timezone })),
  });

  await runAtomic(async (tx) => {
    for (const item of scheduled) {
      await tx
        .update(enrollments)
        .set({ status: "active", mailboxId: item.mailboxId, nextSendAt: item.nextSendAt })
        .where(eq(enrollments.id, item.id));
    }
    await tx.update(campaigns).set({ status: "active" }).where(eq(campaigns.id, id));
  });

  return NextResponse.json({ started: true, enrolled: scheduled.length });
}
