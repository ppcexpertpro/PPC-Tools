import { sql, eq } from "drizzle-orm";
import { db, queryClient } from "@/db/client";
import { campaigns, contacts, enrollments, mailboxes, messages, events } from "@/db/schema";
import { encrypt, loadEncryptionKey } from "@/lib/outreach/crypto";
import { runTick } from "@/worker/tick";
import type { Transport } from "@/lib/outreach/transport/types";

// No real SMTP sink is available in this environment (no Docker/MailHog),
// so this test verifies everything the worker is responsible for *except*
// the actual network send: claiming, template rendering, the unsubscribe
// token, and the DB state transitions. The real SMTP path (nodemailer
// wiring) is unit-tested with a mocked transport in transport/smtp.test.ts;
// this fake plays the same role here against a real database.
function createFakeTransport(): Transport & { sentMessages: unknown[] } {
  const sentMessages: unknown[] = [];
  return {
    sentMessages,
    async verify() {},
    async send(message) {
      sentMessages.push(message);
      return { rfcMessageId: `<fake-${sentMessages.length}@test>` };
    },
  };
}

describe("worker tick (integration)", () => {
  beforeEach(async () => {
    await db.execute(
      sql`TRUNCATE TABLE messages, events, enrollments, campaigns, mailboxes, contacts, suppressions RESTART IDENTITY CASCADE`,
    );
  });

  afterAll(async () => {
    await queryClient.end({ timeout: 5 });
  });

  it("sends a due enrollment and marks it completed", async () => {
    const key = loadEncryptionKey();
    const credentials = encrypt(
      JSON.stringify({ host: "localhost", port: 1025, secure: false, user: "", pass: "" }),
      key,
    );

    const [mailbox] = await db
      .insert(mailboxes)
      .values({
        provider: "smtp",
        fromName: "Jane",
        fromEmail: "jane@example.com",
        encryptedCredentials: credentials,
        dailyCap: 50,
      })
      .returning();

    const [campaign] = await db
      .insert(campaigns)
      .values({
        mailboxId: mailbox.id,
        name: "Test campaign",
        subjectTemplate: "Hi {{first_name}}",
        bodyTemplate: "Hello {{first_name}}, this is a test. Unsubscribe: {{unsubscribe_token}}",
        postalAddress: "123 Main St",
        status: "active",
      })
      .returning();

    const [contact] = await db
      .insert(contacts)
      .values({ email: "recipient@example.com", fields: { first_name: "Alex" } })
      .returning();

    const [enrollment] = await db
      .insert(enrollments)
      .values({
        campaignId: campaign.id,
        contactId: contact.id,
        status: "active",
        nextSendAt: new Date(Date.now() - 1000),
      })
      .returning();

    const fakeTransport = createFakeTransport();
    const result = await runTick(new Date(), () => fakeTransport);

    expect(result).toEqual({ attempted: 1, sent: 1, failed: 0 });
    expect(fakeTransport.sentMessages).toHaveLength(1);
    expect(fakeTransport.sentMessages[0]).toMatchObject({
      to: "recipient@example.com",
      subject: "Hi Alex",
      text: expect.stringContaining("Hello Alex"),
    });
    // No tracking pixel or bulk headers - just the rendered plain text.
    expect((fakeTransport.sentMessages[0] as { text: string }).text).not.toMatch(/<img/i);

    const [updatedEnrollment] = await db.select().from(enrollments).where(eq(enrollments.id, enrollment.id));
    expect(updatedEnrollment.status).toBe("completed");
    expect(updatedEnrollment.sentAt).not.toBeNull();

    const sentMessageRows = await db.select().from(messages).where(eq(messages.enrollmentId, enrollment.id));
    expect(sentMessageRows).toHaveLength(1);

    const messageSentEvents = await db.select().from(events).where(eq(events.type, "message_sent"));
    expect(messageSentEvents).toHaveLength(1);
  });

  it("does nothing when there is nothing due", async () => {
    const fakeTransport = createFakeTransport();
    expect(await runTick(new Date(), () => fakeTransport)).toEqual({ attempted: 0, sent: 0, failed: 0 });
  });

  it("sends at most one message per mailbox per tick, even with two due enrollments", async () => {
    const key = loadEncryptionKey();
    const credentials = encrypt(
      JSON.stringify({ host: "localhost", port: 1025, secure: false, user: "", pass: "" }),
      key,
    );

    const [mailbox] = await db
      .insert(mailboxes)
      .values({ provider: "smtp", fromName: "Jane", fromEmail: "jane@example.com", encryptedCredentials: credentials, dailyCap: 50 })
      .returning();

    const [campaign] = await db
      .insert(campaigns)
      .values({
        mailboxId: mailbox.id,
        name: "Test campaign",
        subjectTemplate: "Hi {{first_name}}",
        bodyTemplate: "Hello {{first_name}}",
        postalAddress: "123 Main St",
        status: "active",
      })
      .returning();

    const [contactA] = await db.insert(contacts).values({ email: "a@example.com", fields: { first_name: "A" } }).returning();
    const [contactB] = await db.insert(contacts).values({ email: "b@example.com", fields: { first_name: "B" } }).returning();

    await db.insert(enrollments).values([
      { campaignId: campaign.id, contactId: contactA.id, status: "active", nextSendAt: new Date(Date.now() - 2000) },
      { campaignId: campaign.id, contactId: contactB.id, status: "active", nextSendAt: new Date(Date.now() - 1000) },
    ]);

    const fakeTransport = createFakeTransport();
    const result = await runTick(new Date(), () => fakeTransport);

    expect(result).toEqual({ attempted: 1, sent: 1, failed: 0 });
    expect(fakeTransport.sentMessages).toHaveLength(1);

    const remainingActive = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.campaignId, campaign.id));
    const stillActive = remainingActive.filter((e) => e.status === "active");
    expect(stillActive).toHaveLength(1); // the un-claimed one waits for the next tick
  });
});
