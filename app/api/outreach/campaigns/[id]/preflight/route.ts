import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { campaigns, mailboxes, contacts, enrollments, sequenceSteps } from "@/db/schema";
import { runPreflight } from "@/lib/outreach/preflight";

export async function GET(_request: Request, ctx: RouteContext<"/api/outreach/campaigns/[id]/preflight">) {
  const { id } = await ctx.params;

  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  const [mailbox] = await db.select().from(mailboxes).where(eq(mailboxes.id, campaign.mailboxId));
  if (!mailbox) return NextResponse.json({ error: "Mailbox not found" }, { status: 404 });

  const steps = await db
    .select({ subjectTemplate: sequenceSteps.subjectTemplate, bodyTemplate: sequenceSteps.bodyTemplate })
    .from(sequenceSteps)
    .where(eq(sequenceSteps.campaignId, id))
    .orderBy(asc(sequenceSteps.stepOrder));

  const senderDomain = mailbox.fromEmail.split("@")[1] ?? "";
  const enrolledContacts = await db
    .select({ id: contacts.id, email: contacts.email, fields: contacts.fields })
    .from(contacts)
    .innerJoin(enrollments, eq(enrollments.contactId, contacts.id))
    .where(eq(enrollments.campaignId, id));

  const result = await runPreflight({
    senderDomain,
    dkimSelector: "default",
    postalAddress: campaign.postalAddress,
    templates: steps.flatMap((step) => [step.subjectTemplate, step.bodyTemplate]),
    contacts: enrolledContacts,
  });

  return NextResponse.json(result);
}
