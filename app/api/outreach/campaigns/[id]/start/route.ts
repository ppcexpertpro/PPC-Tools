import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { campaigns, mailboxes, contacts, enrollments } from "@/db/schema";
import { runPreflight } from "@/lib/outreach/preflight";
import { scheduleCampaignStart } from "@/lib/outreach/campaigns/start";

export async function POST(_request: Request, ctx: RouteContext<"/api/outreach/campaigns/[id]/start">) {
  const { id } = await ctx.params;

  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  if (campaign.status !== "draft") {
    return NextResponse.json({ error: `Campaign is already ${campaign.status}` }, { status: 409 });
  }

  const [mailbox] = await db.select().from(mailboxes).where(eq(mailboxes.id, campaign.mailboxId));
  if (!mailbox) return NextResponse.json({ error: "Mailbox not found" }, { status: 404 });

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

  const senderDomain = mailbox.fromEmail.split("@")[1] ?? "";
  const preflight = await runPreflight({
    senderDomain,
    dkimSelector: "default",
    postalAddress: campaign.postalAddress,
    templates: [campaign.subjectTemplate, campaign.bodyTemplate],
    contacts: pending.map((p) => ({ id: p.contactId, email: p.email, fields: p.fields })),
  });

  if (!preflight.pass) {
    return NextResponse.json({ error: "Preflight checks failed", preflight }, { status: 422 });
  }

  const scheduled = scheduleCampaignStart({
    now: new Date(),
    baseIntervalSeconds: campaign.baseIntervalSeconds,
    businessHours: {
      startHour: campaign.businessHoursStart,
      endHour: campaign.businessHoursEnd,
      days: campaign.businessDays,
    },
    mailbox: { dailyCap: mailbox.dailyCap, rampStartedAt: mailbox.rampStartedAt },
    domainThrottleLimit: campaign.domainThrottleLimit,
    alreadySentByMailboxToday: 0,
    enrollments: pending.map((p) => ({ id: p.enrollmentId, email: p.email, timezone: p.timezone })),
  });

  await db.transaction(async (tx) => {
    for (const item of scheduled) {
      await tx.update(enrollments).set({ status: "active", nextSendAt: item.nextSendAt }).where(eq(enrollments.id, item.id));
    }
    await tx.update(campaigns).set({ status: "active" }).where(eq(campaigns.id, id));
  });

  return NextResponse.json({ started: true, enrolled: scheduled.length });
}
