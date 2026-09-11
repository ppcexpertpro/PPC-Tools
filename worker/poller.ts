import { config } from "dotenv";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { campaigns, contacts, enrollments, mailboxes, suppressions } from "@/db/schema";
import { decrypt, loadEncryptionKey } from "@/lib/outreach/crypto";
import { parseMailboxCredentials } from "@/lib/outreach/mailboxes/credentials";
import { createImapClient, type ImapClient, type InboxMessage } from "@/lib/outreach/transport/imap";
import { createGmailPollClient, type GmailPollClient } from "@/lib/outreach/transport/gmailPoll";
import type { ImapCredentials, GoogleOAuthCredentials } from "@/lib/outreach/mailboxes/credentials";
import { isDsnMessage, extractStatusCode, classifyStatusCode } from "@/lib/outreach/poller/bounce";
import { matchReplies } from "@/lib/outreach/poller/replyMatching";

config({ quiet: true });

const POLL_INTERVAL_MS = 3 * 60 * 1000;

export interface PollResult {
  mailboxesPolled: number;
  replied: number;
  bounced: number;
}

export async function runPoll(
  now: Date = new Date(),
  createImapPollClient: (credentials: ImapCredentials) => ImapClient = createImapClient,
  createGmailPollClientFactory: (credentials: GoogleOAuthCredentials) => GmailPollClient = createGmailPollClient,
): Promise<PollResult> {
  const encryptionKey = loadEncryptionKey();

  const activeMailboxes = await db
    .selectDistinct({
      mailboxId: mailboxes.id,
      provider: mailboxes.provider,
      encryptedCredentials: mailboxes.encryptedCredentials,
      lastPolledAt: mailboxes.lastPolledAt,
      lastHistoryId: mailboxes.lastHistoryId,
      createdAt: mailboxes.createdAt,
    })
    .from(mailboxes)
    .innerJoin(campaigns, eq(campaigns.mailboxId, mailboxes.id))
    .innerJoin(enrollments, and(eq(enrollments.campaignId, campaigns.id), eq(enrollments.status, "active")));

  let mailboxesPolled = 0;
  let replied = 0;
  let bounced = 0;

  for (const mailbox of activeMailboxes) {
    const credentials = parseMailboxCredentials(decrypt(mailbox.encryptedCredentials, encryptionKey));

    let inboxMessages: InboxMessage[];
    let updates: { lastPolledAt?: Date; lastHistoryId?: string | null };

    if (mailbox.provider === "gmail_oauth") {
      if (!credentials.oauth) continue; // shouldn't happen by construction, but never crash the poll loop over it
      const client = createGmailPollClientFactory(credentials.oauth);
      const result = await client.fetchNew(mailbox.lastHistoryId, mailbox.createdAt);
      inboxMessages = result.messages;
      updates = { lastHistoryId: result.newHistoryId };
    } else if (credentials.imap) {
      const since = mailbox.lastPolledAt ?? new Date(0);
      const client = createImapPollClient(credentials.imap);
      inboxMessages = await client.fetchSince(since);
      updates = { lastPolledAt: now };
    } else {
      continue; // SMTP mailbox connected before Phase 2, no IMAP details yet
    }

    mailboxesPolled += 1;

    const repliedFromAddresses = new Set<string>();

    for (const message of inboxMessages) {
      if (isDsnMessage(message.from, message.source)) {
        const status = classifyStatusCode(extractStatusCode(message.source));
        if (status === "hard") {
          bounced += await handleBounce(mailbox.mailboxId, message.source);
        }
      } else if (message.from) {
        repliedFromAddresses.add(message.from);
      }
    }

    if (repliedFromAddresses.size > 0) {
      replied += await handleReplies(mailbox.mailboxId, repliedFromAddresses);
    }

    await db.update(mailboxes).set(updates).where(eq(mailboxes.id, mailbox.mailboxId));
  }

  return { mailboxesPolled, replied, bounced };
}

async function handleReplies(mailboxId: string, repliedFromAddresses: Set<string>): Promise<number> {
  const activeForMailbox = await db
    .select({ enrollmentId: enrollments.id, contactEmail: contacts.email })
    .from(enrollments)
    .innerJoin(campaigns, eq(campaigns.id, enrollments.campaignId))
    .innerJoin(contacts, eq(contacts.id, enrollments.contactId))
    .where(and(eq(campaigns.mailboxId, mailboxId), eq(enrollments.status, "active")));

  const repliedEnrollmentIds = matchReplies(
    activeForMailbox.map((row) => ({ enrollmentId: row.enrollmentId, contactEmail: row.contactEmail })),
    repliedFromAddresses,
  );

  for (const enrollmentId of repliedEnrollmentIds) {
    await db
      .update(enrollments)
      .set({ status: "replied", nextSendAt: null })
      .where(eq(enrollments.id, enrollmentId));
  }

  return repliedEnrollmentIds.length;
}

/** A hard-bounce DSN doesn't reliably say *which* enrollment it's for in a
 * form worth parsing (the original recipient address is usually buried in
 * an attached message/rfc822 part, not a clean header) - instead, since a
 * bounce implies the target address is undeliverable everywhere, every
 * currently-active enrollment for a contact that has *any* delivery
 * attempt through this mailbox and matches an address referenced in the
 * bounce text is suppressed. In practice this DSN carries the recipient's
 * address in its body, so a simple substring search against each active
 * contact's email is enough without a MIME parser. */
async function handleBounce(mailboxId: string, dsnSource: string): Promise<number> {
  const activeForMailbox = await db
    .select({ enrollmentId: enrollments.id, contactEmail: contacts.email })
    .from(enrollments)
    .innerJoin(campaigns, eq(campaigns.id, enrollments.campaignId))
    .innerJoin(contacts, eq(contacts.id, enrollments.contactId))
    .where(and(eq(campaigns.mailboxId, mailboxId), eq(enrollments.status, "active")));

  const lowerSource = dsnSource.toLowerCase();
  let count = 0;

  for (const row of activeForMailbox) {
    if (!lowerSource.includes(row.contactEmail.toLowerCase())) continue;

    await db.update(enrollments).set({ status: "bounced", nextSendAt: null }).where(eq(enrollments.id, row.enrollmentId));
    await db.insert(suppressions).values({ email: row.contactEmail, reason: "hard_bounce" }).onConflictDoNothing();
    count += 1;
  }

  return count;
}

if (require.main === module) {
  console.log(`Outreach poller started, polling every ${POLL_INTERVAL_MS / 1000}s`);
  const loop = async () => {
    try {
      const result = await runPoll();
      if (result.mailboxesPolled > 0) {
        console.log(`poll: mailboxes=${result.mailboxesPolled} replied=${result.replied} bounced=${result.bounced}`);
      }
    } catch (error) {
      console.error("poll failed", error);
    } finally {
      setTimeout(loop, POLL_INTERVAL_MS);
    }
  };
  void loop();
}
