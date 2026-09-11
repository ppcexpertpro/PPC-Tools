import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { campaigns, campaignMailboxes, mailboxes, contacts, enrollments, sequenceSteps } from "@/db/schema";
import { runPoolPreflight } from "@/lib/outreach/preflight/pool";

export async function GET(_request: Request, ctx: RouteContext<"/api/outreach/campaigns/[id]/preflight">) {
  const { id } = await ctx.params;

  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  const pool = await db
    .select({ fromEmail: mailboxes.fromEmail })
    .from(campaignMailboxes)
    .innerJoin(mailboxes, eq(mailboxes.id, campaignMailboxes.mailboxId))
    .where(eq(campaignMailboxes.campaignId, id));
  if (pool.length === 0) return NextResponse.json({ error: "Campaign has no mailboxes" }, { status: 422 });

  const steps = await db
    .select({ subjectTemplate: sequenceSteps.subjectTemplate, bodyTemplate: sequenceSteps.bodyTemplate })
    .from(sequenceSteps)
    .where(eq(sequenceSteps.campaignId, id))
    .orderBy(asc(sequenceSteps.stepOrder));

  const enrolledContacts = await db
    .select({ id: contacts.id, email: contacts.email, fields: contacts.fields })
    .from(contacts)
    .innerJoin(enrollments, eq(enrollments.contactId, contacts.id))
    .where(eq(enrollments.campaignId, id));

  const senderDomains = [...new Set(pool.map((m) => m.fromEmail.split("@")[1] ?? ""))];
  const result = await runPoolPreflight({
    senderDomains,
    dkimSelector: "default",
    postalAddress: campaign.postalAddress,
    templates: steps.flatMap((step) => [step.subjectTemplate, step.bodyTemplate]),
    contacts: enrolledContacts,
  });

  return NextResponse.json(result);
}
