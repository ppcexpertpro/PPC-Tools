import { config } from "dotenv";
import { and, asc, eq, isNotNull, lte } from "drizzle-orm";
import { db, runAtomic } from "@/db/client";
import { campaigns, contacts, enrollments, mailboxes, messages, events, sequenceSteps, workerHeartbeats } from "@/db/schema";
import { decrypt, loadEncryptionKey } from "@/lib/outreach/crypto";
import { parseMailboxCredentials } from "@/lib/outreach/mailboxes/credentials";
import { createSmtpTransport } from "@/lib/outreach/transport/smtp";
import { createGmailTransport } from "@/lib/outreach/transport/gmail";
import type { Transport } from "@/lib/outreach/transport/types";
import type { SmtpCredentials } from "@/lib/outreach/transport/smtp";
import type { GoogleOAuthCredentials } from "@/lib/outreach/mailboxes/credentials";
import { renderTemplate } from "@/lib/outreach/templates/render";
import { buildThreadHeaders } from "@/lib/outreach/templates/threading";
import { signUnsubscribeToken, loadUnsubscribeSecret } from "@/lib/outreach/unsubscribe/token";
import { computeNextSendAt } from "@/lib/outreach/scheduler";
import { extractDomain } from "@/lib/outreach/scheduler/domainThrottle";
import { countSentByMailboxToday, countSentToDomainLast24h } from "@/lib/outreach/scheduler/sendCounts";

config({ quiet: true });

const TICK_INTERVAL_MS = 15_000;
const CLAIM_BATCH_SIZE = 25;
const SECONDS_PER_DAY = 24 * 60 * 60;

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
 * SKIP LOCKED) ... RETURNING`) instead. `createSmtpTransportClient`/
 * `createGmailTransportClient` are injectable so this can be
 * integration-tested against a real database without a real SMTP server or
 * Google account.
 */
export async function runTick(
  now: Date = new Date(),
  createSmtpTransportClient: (credentials: SmtpCredentials) => Transport = createSmtpTransport,
  createGmailTransportClient: (credentials: GoogleOAuthCredentials) => Transport = createGmailTransport,
): Promise<TickResult> {
  const encryptionKey = loadEncryptionKey();
  const unsubscribeSecret = loadUnsubscribeSecret();

  const due = await db
    .select({
      enrollmentId: enrollments.id,
      campaignId: enrollments.campaignId,
      currentStep: enrollments.currentStep,
      mailboxId: mailboxes.id,
      mailboxProvider: mailboxes.provider,
      mailboxCredentials: mailboxes.encryptedCredentials,
      mailboxFromName: mailboxes.fromName,
      mailboxFromEmail: mailboxes.fromEmail,
      contactId: enrollments.contactId,
      contactEmail: contacts.email,
      contactFields: contacts.fields,
      contactTimezone: contacts.timezone,
      stepId: sequenceSteps.id,
      subjectTemplate: sequenceSteps.subjectTemplate,
      bodyTemplate: sequenceSteps.bodyTemplate,
      baseIntervalSeconds: campaigns.baseIntervalSeconds,
      businessHoursStart: campaigns.businessHoursStart,
      businessHoursEnd: campaigns.businessHoursEnd,
      businessDays: campaigns.businessDays,
      domainThrottleLimit: campaigns.domainThrottleLimit,
      mailboxDailyCap: mailboxes.dailyCap,
      mailboxRampStartedAt: mailboxes.rampStartedAt,
    })
    .from(enrollments)
    .innerJoin(campaigns, eq(campaigns.id, enrollments.campaignId))
    .innerJoin(mailboxes, eq(mailboxes.id, enrollments.mailboxId))
    .innerJoin(contacts, eq(contacts.id, enrollments.contactId))
    .innerJoin(
      sequenceSteps,
      and(eq(sequenceSteps.campaignId, campaigns.id), eq(sequenceSteps.stepOrder, enrollments.currentStep)),
    )
    .where(
      and(
        eq(enrollments.status, "active"),
        eq(campaigns.status, "active"),
        eq(mailboxes.health, "healthy"),
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
      const credentials = parseMailboxCredentials(decrypt(row.mailboxCredentials, encryptionKey));

      let transport: Transport;
      if (row.mailboxProvider === "gmail_oauth") {
        if (!credentials.oauth) throw new Error(`Mailbox ${row.mailboxId} is gmail_oauth but has no oauth credentials.`);
        transport = createGmailTransportClient(credentials.oauth);
      } else {
        if (!credentials.smtp) throw new Error(`Mailbox ${row.mailboxId} is not gmail_oauth but has no smtp credentials.`);
        transport = createSmtpTransportClient(credentials.smtp);
      }

      const priorMessages = await db
        .select({ rfcMessageId: messages.rfcMessageId, providerThreadId: messages.providerThreadId })
        .from(messages)
        .where(eq(messages.enrollmentId, row.enrollmentId))
        .orderBy(asc(messages.sentAt));
      const threadHeaders = buildThreadHeaders(priorMessages.map((m) => m.rfcMessageId));
      const providerThreadId = priorMessages[0]?.providerThreadId ?? undefined;

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
        inReplyTo: threadHeaders.inReplyTo,
        references: threadHeaders.references,
        threadId: providerThreadId,
      });

      const [nextStep] = await db
        .select({ delayDays: sequenceSteps.delayDays })
        .from(sequenceSteps)
        .where(and(eq(sequenceSteps.campaignId, row.campaignId), eq(sequenceSteps.stepOrder, row.currentStep + 1)));

      // Counted here, before the send below is recorded, deliberately -
      // querying through countSentByMailboxToday/countSentToDomainLast24h
      // (which use the module-level `db`, not the `tx` below) from *inside*
      // runAtomic would be a transaction-visibility trap: in production
      // it's a different connection and correctly wouldn't see the
      // not-yet-committed insert, but in test mode runAtomic's passthrough
      // makes `tx` literally the same connection as `db`, which *would*
      // see its own uncommitted write - the same code would silently count
      // differently between prod and test. Querying before the insert
      // exists at all sidesteps that entirely; the explicit `+ 1` below
      // accounts for the send about to be recorded.
      const [sentByMailboxToday, sentToDomainLast24h] = nextStep
        ? await Promise.all([
            countSentByMailboxToday(row.mailboxId, now),
            countSentToDomainLast24h(row.mailboxId, extractDomain(row.contactEmail), now),
          ])
        : [0, 0];

      await runAtomic(async (tx) => {
        await tx.insert(messages).values({
          enrollmentId: row.enrollmentId,
          stepId: row.stepId,
          rfcMessageId: result.rfcMessageId,
          providerThreadId: result.providerThreadId ?? null,
          status: "sent",
        });

        if (nextStep) {
          const decision = computeNextSendAt({
            now,
            timezone: row.contactTimezone,
            baseIntervalSeconds: nextStep.delayDays * SECONDS_PER_DAY,
            businessHours: {
              startHour: row.businessHoursStart,
              endHour: row.businessHoursEnd,
              days: row.businessDays,
            },
            mailbox: { dailyCap: row.mailboxDailyCap, rampStartedAt: row.mailboxRampStartedAt },
            // +1 - sentByMailboxToday/sentToDomainLast24h above were
            // counted before the send below was recorded, so they don't
            // include it yet.
            sentByMailboxToday: sentByMailboxToday + 1,
            sentToDomainLast24h: sentToDomainLast24h + 1,
            domainThrottleLimit: row.domainThrottleLimit,
          });
          const nextSendAt = decision.allowed ? decision.nextSendAt : decision.retryAt;
          await tx
            .update(enrollments)
            .set({ status: "active", sentAt: now, currentStep: row.currentStep + 1, nextSendAt })
            .where(eq(enrollments.id, row.enrollmentId));
        } else {
          await tx
            .update(enrollments)
            .set({ status: "completed", sentAt: now, nextSendAt: null })
            .where(eq(enrollments.id, row.enrollmentId));
        }

        await tx.insert(events).values({
          type: "message_sent",
          payload: { enrollmentId: row.enrollmentId, rfcMessageId: result.rfcMessageId, step: row.currentStep },
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

  const result = { attempted, sent, failed };
  await db
    .insert(workerHeartbeats)
    .values({ process: "worker", lastRunAt: now, lastResult: result })
    .onConflictDoUpdate({ target: workerHeartbeats.process, set: { lastRunAt: now, lastResult: result } });

  return result;
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
