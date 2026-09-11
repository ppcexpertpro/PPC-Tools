import { sql, eq } from "drizzle-orm";
import { db, queryClient } from "@/db/client";
import { campaigns, contacts, enrollments, mailboxes, sequenceSteps, suppressions } from "@/db/schema";
import { encrypt, loadEncryptionKey } from "@/lib/outreach/crypto";
import { runPoll } from "@/worker/poller";
import type { ImapClient } from "@/lib/outreach/transport/imap";
import type { GmailPollClient } from "@/lib/outreach/transport/gmailPoll";

function fakeImapClient(messages: { from: string; source: string }[]): ImapClient {
  return {
    async verify() {},
    async fetchSince() {
      return messages;
    },
  };
}

function fakeGmailPollClient(messages: { from: string; source: string }[]): GmailPollClient {
  return {
    async verify() {},
    async fetchNew() {
      return { messages, newHistoryId: "9999" };
    },
  };
}

describe("poller (integration)", () => {
  beforeEach(async () => {
    await db.execute(
      sql`TRUNCATE TABLE messages, events, enrollments, sequence_steps, campaigns, mailboxes, contacts, suppressions RESTART IDENTITY CASCADE`,
    );
  });

  afterAll(async () => {
    await queryClient.end({ timeout: 5 });
  });

  async function makeActiveEnrollment(contactEmail: string) {
    const key = loadEncryptionKey();
    const credentials = encrypt(
      JSON.stringify({
        smtp: { host: "localhost", port: 1025, secure: false, user: "", pass: "" },
        imap: { host: "imap.example.com", port: 993, secure: true, user: "u", pass: "p" },
      }),
      key,
    );
    const [mailbox] = await db
      .insert(mailboxes)
      .values({ provider: "smtp", fromName: "Jane", fromEmail: "jane@example.com", encryptedCredentials: credentials, dailyCap: 50 })
      .returning();
    const [campaign] = await db
      .insert(campaigns)
      .values({ mailboxId: mailbox.id, name: "Test", postalAddress: "123 Main St", status: "active" })
      .returning();
    await db.insert(sequenceSteps).values({ campaignId: campaign.id, stepOrder: 1, subjectTemplate: "Hi", bodyTemplate: "Body", delayDays: 0 });
    const [contact] = await db.insert(contacts).values({ email: contactEmail, fields: {} }).returning();
    const [enrollment] = await db
      .insert(enrollments)
      .values({ campaignId: campaign.id, contactId: contact.id, status: "active", currentStep: 1, nextSendAt: new Date() })
      .returning();
    return { mailbox, campaign, contact, enrollment };
  }

  it("marks an enrollment replied when its contact's address appears in the inbox", async () => {
    const { enrollment } = await makeActiveEnrollment("recipient@example.com");

    const result = await runPoll(new Date(), () =>
      fakeImapClient([{ from: "recipient@example.com", source: "Subject: Re: hi\n\nSure, let's talk." }]),
    );

    expect(result).toEqual({ mailboxesPolled: 1, replied: 1, bounced: 0 });
    const [updated] = await db.select().from(enrollments).where(eq(enrollments.id, enrollment.id));
    expect(updated.status).toBe("replied");
    expect(updated.nextSendAt).toBeNull();
  });

  it("suppresses and marks bounced on a hard-bounce DSN mentioning the contact", async () => {
    const { enrollment, contact } = await makeActiveEnrollment("bouncy@example.com");

    const dsnSource = [
      "From: mailer-daemon@relay.example.com",
      "Content-Type: multipart/report; report-type=delivery-status",
      "",
      "Status: 5.1.1",
      "Original-Recipient: rfc822;bouncy@example.com",
    ].join("\n");

    const result = await runPoll(new Date(), () =>
      fakeImapClient([{ from: "mailer-daemon@relay.example.com", source: dsnSource }]),
    );

    expect(result).toEqual({ mailboxesPolled: 1, replied: 0, bounced: 1 });
    const [updated] = await db.select().from(enrollments).where(eq(enrollments.id, enrollment.id));
    expect(updated.status).toBe("bounced");
    const suppressed = await db.select().from(suppressions).where(eq(suppressions.email, contact.email));
    expect(suppressed).toHaveLength(1);
  });

  it("ignores a soft-bounce DSN (4.x.x) - no status change, no suppression", async () => {
    const { enrollment, contact } = await makeActiveEnrollment("softbounce@example.com");

    const dsnSource = [
      "From: mailer-daemon@relay.example.com",
      "Content-Type: multipart/report; report-type=delivery-status",
      "",
      "Status: 4.2.2",
      "Original-Recipient: rfc822;softbounce@example.com",
    ].join("\n");

    const result = await runPoll(new Date(), () =>
      fakeImapClient([{ from: "mailer-daemon@relay.example.com", source: dsnSource }]),
    );

    expect(result).toEqual({ mailboxesPolled: 1, replied: 0, bounced: 0 });
    const [updated] = await db.select().from(enrollments).where(eq(enrollments.id, enrollment.id));
    expect(updated.status).toBe("active");
    const suppressed = await db.select().from(suppressions).where(eq(suppressions.email, contact.email));
    expect(suppressed).toHaveLength(0);
  });

  it("skips a mailbox that has no IMAP credentials yet (connected before Phase 2)", async () => {
    const key = loadEncryptionKey();
    const oldShapeCredentials = encrypt(
      JSON.stringify({ host: "localhost", port: 1025, secure: false, user: "", pass: "" }),
      key,
    );
    const [mailbox] = await db
      .insert(mailboxes)
      .values({ provider: "smtp", fromName: "Jane", fromEmail: "jane@example.com", encryptedCredentials: oldShapeCredentials, dailyCap: 50 })
      .returning();
    const [campaign] = await db
      .insert(campaigns)
      .values({ mailboxId: mailbox.id, name: "Test", postalAddress: "123 Main St", status: "active" })
      .returning();
    await db.insert(sequenceSteps).values({ campaignId: campaign.id, stepOrder: 1, subjectTemplate: "Hi", bodyTemplate: "Body", delayDays: 0 });
    const [contact] = await db.insert(contacts).values({ email: "someone@example.com", fields: {} }).returning();
    await db.insert(enrollments).values({ campaignId: campaign.id, contactId: contact.id, status: "active", currentStep: 1, nextSendAt: new Date() });

    const result = await runPoll(new Date(), () => fakeImapClient([]));
    expect(result).toEqual({ mailboxesPolled: 0, replied: 0, bounced: 0 });
  });

  it("dispatches Gmail-provider mailboxes through history.list instead of IMAP", async () => {
    const key = loadEncryptionKey();
    const credentials = encrypt(JSON.stringify({ oauth: { refreshToken: "1//test", email: "jane@gmail.com" } }), key);

    const [mailbox] = await db
      .insert(mailboxes)
      .values({ provider: "gmail_oauth", fromName: "Jane", fromEmail: "jane@gmail.com", encryptedCredentials: credentials, dailyCap: 50 })
      .returning();
    const [campaign] = await db
      .insert(campaigns)
      .values({ mailboxId: mailbox.id, name: "Test", postalAddress: "123 Main St", status: "active" })
      .returning();
    await db.insert(sequenceSteps).values({ campaignId: campaign.id, stepOrder: 1, subjectTemplate: "Hi", bodyTemplate: "Body", delayDays: 0 });
    const [contact] = await db.insert(contacts).values({ email: "recipient@example.com", fields: {} }).returning();
    const [enrollment] = await db
      .insert(enrollments)
      .values({ campaignId: campaign.id, contactId: contact.id, status: "active", currentStep: 1, nextSendAt: new Date() })
      .returning();

    const result = await runPoll(
      new Date(),
      () => fakeImapClient([]),
      () => fakeGmailPollClient([{ from: "recipient@example.com", source: "Subject: Re: hi\n\nSure." }]),
    );

    expect(result).toEqual({ mailboxesPolled: 1, replied: 1, bounced: 0 });
    const [updated] = await db.select().from(enrollments).where(eq(enrollments.id, enrollment.id));
    expect(updated.status).toBe("replied");

    const [updatedMailbox] = await db.select().from(mailboxes).where(eq(mailboxes.id, mailbox.id));
    expect(updatedMailbox.lastHistoryId).toBe("9999");
  });
});
