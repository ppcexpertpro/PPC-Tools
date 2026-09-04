import { computeNextSendAt, type ScheduleInput } from "@/lib/outreach/scheduler";
import { extractDomain } from "@/lib/outreach/scheduler/domainThrottle";

export interface EnrollmentToSchedule {
  id: string;
  email: string;
  timezone: string;
}

export interface ScheduleCampaignInput {
  now: Date;
  baseIntervalSeconds: number;
  businessHours: { startHour: number; endHour: number; days: number[] };
  mailbox: { dailyCap: number; rampStartedAt: Date | null };
  domainThrottleLimit: number;
  alreadySentByMailboxToday: number;
  enrollments: EnrollmentToSchedule[];
}

export interface ScheduledEnrollment {
  id: string;
  nextSendAt: Date;
}

/**
 * Assigns a `nextSendAt` to every pending enrollment for a campaign that is
 * starting now, walking the scheduler forward one contact at a time so the
 * daily cap and domain throttle apply across the whole batch, not just
 * per-contact.
 */
export function scheduleCampaignStart(input: ScheduleCampaignInput): ScheduledEnrollment[] {
  const domainCounts = new Map<string, number>();
  let mailboxCountToday = input.alreadySentByMailboxToday;
  let cursor = input.now;
  const scheduled: ScheduledEnrollment[] = [];

  for (const enrollment of input.enrollments) {
    const domain = extractDomain(enrollment.email);
    const domainCount = domainCounts.get(domain) ?? 0;

    const decision = computeNextSendAt({
      now: cursor,
      timezone: enrollment.timezone,
      baseIntervalSeconds: input.baseIntervalSeconds,
      businessHours: input.businessHours,
      mailbox: input.mailbox,
      sentByMailboxToday: mailboxCountToday,
      sentToDomainLast24h: domainCount,
      domainThrottleLimit: input.domainThrottleLimit,
    } satisfies ScheduleInput);

    if (decision.allowed) {
      scheduled.push({ id: enrollment.id, nextSendAt: decision.nextSendAt });
      cursor = decision.nextSendAt;
      mailboxCountToday += 1;
      domainCounts.set(domain, domainCount + 1);
    } else {
      cursor = decision.retryAt;
      mailboxCountToday = 0;
      domainCounts.set(domain, 0);
      scheduled.push({ id: enrollment.id, nextSendAt: decision.retryAt });
    }
  }

  return scheduled;
}
