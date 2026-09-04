import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { campaigns, mailboxes, contacts, enrollments } from "@/db/schema";
import { runPreflight } from "@/lib/outreach/preflight";

export async function GET(_request: Request, ctx: RouteContext<"/api/outreach/campaigns/[id]/preflight">) {
  const { id } = await ctx.params;

  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  const [mailbox] = await db.select().from(mailboxes).where(eq(mailboxes.id, campaign.mailboxId));
  if (!mailbox) return NextResponse.json({ error: "Mailbox not found" }, { status: 404 });

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
    templates: [campaign.subjectTemplate, campaign.bodyTemplate],
    contacts: enrolledContacts,
  });

  return NextResponse.json(result);
}
