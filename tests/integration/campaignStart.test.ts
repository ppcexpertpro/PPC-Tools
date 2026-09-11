import { sql, eq } from "drizzle-orm";
import { db, queryClient } from "@/db/client";
import { campaigns, campaignMailboxes, contacts, enrollments, mailboxes, sequenceSteps } from "@/db/schema";
import { POST } from "@/app/api/outreach/campaigns/[id]/start/route";

describe("POST /api/outreach/campaigns/[id]/start (integration)", () => {
  beforeEach(async () => {
    await db.execute(
      sql`TRUNCATE TABLE messages, events, enrollments, sequence_steps, campaign_mailboxes, campaigns, mailboxes, contacts, suppressions RESTART IDENTITY CASCADE`,
    );
  });

  afterAll(async () => {
    await queryClient.end({ timeout: 5 });
  });

  it("assigns each enrollment a mailbox from the pool and activates the campaign", async () => {
    const [mailboxA] = await db
      .insert(mailboxes)
      .values({ provider: "smtp", fromName: "A", fromEmail: "a@example.com", encryptedCredentials: "x", dailyCap: 50 })
      .returning();
    const [mailboxB] = await db
      .insert(mailboxes)
      .values({ provider: "smtp", fromName: "B", fromEmail: "b@example.com", encryptedCredentials: "x", dailyCap: 50 })
      .returning();

    const [campaign] = await db
      .insert(campaigns)
      .values({ name: "Pool start test", postalAddress: "123 Main St", status: "draft" })
      .returning();
    await db.insert(campaignMailboxes).values([
      { campaignId: campaign.id, mailboxId: mailboxA.id },
      { campaignId: campaign.id, mailboxId: mailboxB.id },
    ]);
    await db.insert(sequenceSteps).values({ campaignId: campaign.id, stepOrder: 1, subjectTemplate: "Hi {{first_name}}", bodyTemplate: "Hello {{first_name}}", delayDays: 0 });
    const [contact] = await db.insert(contacts).values({ email: "recipient@acme.com", fields: { first_name: "Alex" } }).returning();
    await db.insert(enrollments).values({ campaignId: campaign.id, contactId: contact.id, status: "pending" });

    const response = await POST(new Request("http://localhost", { method: "POST" }), {
      params: Promise.resolve({ id: campaign.id }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.started).toBe(true);

    const [updatedCampaign] = await db.select().from(campaigns).where(eq(campaigns.id, campaign.id));
    expect(updatedCampaign.status).toBe("active");

    const [updatedEnrollment] = await db.select().from(enrollments).where(eq(enrollments.campaignId, campaign.id));
    expect(updatedEnrollment.status).toBe("active");
    expect([mailboxA.id, mailboxB.id]).toContain(updatedEnrollment.mailboxId);
    expect(updatedEnrollment.nextSendAt).not.toBeNull();
  });

  it("excludes a paused pool mailbox from assignment", async () => {
    const [healthyMailbox] = await db
      .insert(mailboxes)
      .values({ provider: "smtp", fromName: "Healthy", fromEmail: "healthy@example.com", encryptedCredentials: "x", dailyCap: 50, health: "healthy" })
      .returning();
    const [pausedMailbox] = await db
      .insert(mailboxes)
      .values({ provider: "smtp", fromName: "Paused", fromEmail: "paused@example.com", encryptedCredentials: "x", dailyCap: 50, health: "paused" })
      .returning();

    const [campaign] = await db
      .insert(campaigns)
      .values({ name: "Paused pool member test", postalAddress: "123 Main St", status: "draft" })
      .returning();
    await db.insert(campaignMailboxes).values([
      { campaignId: campaign.id, mailboxId: healthyMailbox.id },
      { campaignId: campaign.id, mailboxId: pausedMailbox.id },
    ]);
    await db.insert(sequenceSteps).values({ campaignId: campaign.id, stepOrder: 1, subjectTemplate: "Hi", bodyTemplate: "Body", delayDays: 0 });
    const [contact] = await db.insert(contacts).values({ email: "recipient@acme.com", fields: {} }).returning();
    await db.insert(enrollments).values({ campaignId: campaign.id, contactId: contact.id, status: "pending" });

    await POST(new Request("http://localhost", { method: "POST" }), { params: Promise.resolve({ id: campaign.id }) });

    const [updatedEnrollment] = await db.select().from(enrollments).where(eq(enrollments.campaignId, campaign.id));
    expect(updatedEnrollment.mailboxId).toBe(healthyMailbox.id);
  });

  it("fails to start when every pool mailbox is paused", async () => {
    const [pausedMailbox] = await db
      .insert(mailboxes)
      .values({ provider: "smtp", fromName: "Paused", fromEmail: "paused@example.com", encryptedCredentials: "x", dailyCap: 50, health: "paused" })
      .returning();

    const [campaign] = await db
      .insert(campaigns)
      .values({ name: "All paused", postalAddress: "123 Main St", status: "draft" })
      .returning();
    await db.insert(campaignMailboxes).values({ campaignId: campaign.id, mailboxId: pausedMailbox.id });
    await db.insert(sequenceSteps).values({ campaignId: campaign.id, stepOrder: 1, subjectTemplate: "Hi", bodyTemplate: "Body", delayDays: 0 });
    const [contact] = await db.insert(contacts).values({ email: "recipient@acme.com", fields: {} }).returning();
    await db.insert(enrollments).values({ campaignId: campaign.id, contactId: contact.id, status: "pending" });

    const response = await POST(new Request("http://localhost", { method: "POST" }), { params: Promise.resolve({ id: campaign.id }) });
    expect(response.status).toBe(422);
  });
});
