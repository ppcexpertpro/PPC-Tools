import { config } from "dotenv";
import { and, asc, eq, isNotNull, lte } from "drizzle-orm";
import { db } from "@/db/client";
import { campaigns, contacts, enrollments, mailboxes, messages, events } from "@/db/schema";
import { decrypt, loadEncryptionKey } from "@/lib/outreach/crypto";
import { createSmtpTransport, type SmtpCredentials } from "@/lib/outreach/transport/smtp";
import type { Transport } from "@/lib/outreach/transport/types";
import { renderTemplate } from "@/lib/outreach/templates/render";
import { signUnsubscribeToken, loadUnsubscribeSecret } from "@/lib/outreach/unsubscribe/token";

config({ quiet: true });

const TICK_INTERVAL_MS = 15_000;
const CLAIM_BATCH_SIZE = 25;

export interface TickResult {
  attempted: number;
  sent: number;
  failed: number;
}

/**
 * Claims due enrollments and sends them.
 *
 * Concurrency note: this assumes exactly one worker process ticking
 * sequentially (the loop below never starts a new tick until the previous
 * one has fully resolved) — that is Phase 1's whole design, one background
 * process per deployment. The claim query below is a plain SELECT, not
 * SELECT ... FOR UPDATE SKIP LOCKED: a row lock held only for the SELECT's
 * own implicit transaction is released before the (slow, network-bound)
 * send happens, so it would not actually prevent a second concurrent
 * *worker process* from claiming the same row — it would just be
 * misleading ceremony. If this is ever scaled to multiple worker
 * processes, the claim step needs redesigning as a single atomic
 * claim-and-mark statement (e.g. `UPDATE ... FROM (SELECT ... FOR UPDATE
 * SKIP LOCKED) ... RETURNING`) instead. `createTransport` is injectable so
 * this can be integration-tested against a real database without a real
 * SMTP server.
 */
export async function runTick(
  now: Date = new Date(),
  createTransport: (credentials: SmtpCredentials) => Transport = createSmtpTransport,
): Promise<TickResult> {
  const encryptionKey = loadEncryptionKey();
  const unsubscribeSecret = loadUnsubscribeSecret();

  const due = await db
    .select({
      enrollmentId: enrollments.id,
      mailboxId: mailboxes.id,
      subjectTemplate: campaigns.subjectTemplate,
      bodyTemplate: campaigns.bodyTemplate,
      mailboxCredentials: mailboxes.encryptedCredentials,
      mailboxFromName: mailboxes.fromName,
      mailboxFromEmail: mailboxes.fromEmail,
      contactEmail: contacts.email,
      contactFields: contacts.fields,
    })
    .from(enrollments)
    .innerJoin(campaigns, eq(campaigns.id, enrollments.campaignId))
    .innerJoin(mailboxes, eq(mailboxes.id, campaigns.mailboxId))
    .innerJoin(contacts, eq(contacts.id, enrollments.contactId))
    .where(
      and(
        eq(enrollments.status, "active"),
        eq(campaigns.status, "active"),
        isNotNull(enrollments.nextSendAt),
        lte(enrollments.nextSendAt, now),
      ),
    )
    .orderBy(asc(enrollments.nextSendAt))
    .limit(CLAIM_BATCH_SIZE);

  const claimedMailboxes = new Set<string>();
  let attempted = 0;
  let sent = 0;
  let failed = 0;

  for (const row of due) {
    // One in-flight send per mailbox per tick.
    if (claimedMailboxes.has(row.mailboxId)) continue;
    claimedMailboxes.add(row.mailboxId);
    attempted += 1;

    try {
      const credentials = JSON.parse(decrypt(row.mailboxCredentials, encryptionKey)) as SmtpCredentials;
      const transport = createTransport(credentials);

      const unsubscribeToken = signUnsubscribeToken(row.enrollmentId, unsubscribeSecret);
      const fields = { ...row.contactFields, unsubscribe_token: unsubscribeToken };
      const subject = renderTemplate(row.subjectTemplate, fields);
      const text = renderTemplate(row.bodyTemplate, fields);

      const result = await transport.send({
        to: row.contactEmail,
        fromName: row.mailboxFromName,
        fromEmail: row.mailboxFromEmail,
        subject,
        text,
      });

      await db.transaction(async (tx) => {
        await tx.insert(messages).values({ enrollmentId: row.enrollmentId, rfcMessageId: result.rfcMessageId, status: "sent" });
        await tx
          .update(enrollments)
          .set({ status: "completed", sentAt: now, nextSendAt: null })
          .where(eq(enrollments.id, row.enrollmentId));
        await tx.insert(events).values({
          type: "message_sent",
          payload: { enrollmentId: row.enrollmentId, rfcMessageId: result.rfcMessageId },
        });
      });

      sent += 1;
    } catch (error) {
      failed += 1;
      await db.insert(events).values({
        type: "send_failed",
        payload: { enrollmentId: row.enrollmentId, error: error instanceof Error ? error.message : String(error) },
      });
      await db.update(enrollments).set({ status: "failed" }).where(eq(enrollments.id, row.enrollmentId));
    }
  }

  return { attempted, sent, failed };
}

if (require.main === module) {
  console.log(`Outreach worker started, ticking every ${TICK_INTERVAL_MS / 1000}s`);
  const loop = async () => {
    try {
      const result = await runTick();
      if (result.attempted > 0) {
        console.log(`tick: attempted=${result.attempted} sent=${result.sent} failed=${result.failed}`);
      }
    } catch (error) {
      console.error("tick failed", error);
    } finally {
      setTimeout(loop, TICK_INTERVAL_MS);
    }
  };
  void loop();
}
