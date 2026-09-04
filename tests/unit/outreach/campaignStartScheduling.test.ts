import { scheduleCampaignStart } from "@/lib/outreach/campaigns/start";

// Always-open business hours isolates cap/throttle behaviour from the
// business-hours rule already covered in the scheduler's own tests.
const BUSINESS_HOURS = { startHour: 0, endHour: 24, days: [0, 1, 2, 3, 4, 5, 6] };

describe("scheduleCampaignStart", () => {
  it("staggers sends across contacts using the jittered interval", () => {
    const now = new Date("2026-09-03T10:00:00Z");
    const result = scheduleCampaignStart({
      now,
      baseIntervalSeconds: 60,
      businessHours: BUSINESS_HOURS,
      mailbox: { dailyCap: 50, rampStartedAt: null },
      domainThrottleLimit: 10,
      alreadySentByMailboxToday: 0,
      enrollments: [
        { id: "a", email: "a@acme.com", timezone: "UTC" },
        { id: "b", email: "b@beta.com", timezone: "UTC" },
      ],
    });

    expect(result[0].nextSendAt.getTime()).toBeGreaterThan(now.getTime());
    expect(result[1].nextSendAt.getTime()).toBeGreaterThan(result[0].nextSendAt.getTime());
  });

  it("pushes remaining contacts to the next day once the mailbox's daily cap is reached", () => {
    const now = new Date("2026-09-03T10:00:00Z");
    const result = scheduleCampaignStart({
      now,
      baseIntervalSeconds: 60,
      businessHours: BUSINESS_HOURS,
      mailbox: { dailyCap: 1, rampStartedAt: null },
      domainThrottleLimit: 10,
      alreadySentByMailboxToday: 0,
      enrollments: [
        { id: "a", email: "a@acme.com", timezone: "UTC" },
        { id: "b", email: "b@beta.com", timezone: "UTC" },
      ],
    });

    expect(result[0].nextSendAt.getUTCDate()).toBe(3);
    expect(result[1].nextSendAt.getUTCDate()).toBe(4);
  });

  it("throttles a second contact at the same domain within the limit", () => {
    const now = new Date("2026-09-03T10:00:00Z");
    const result = scheduleCampaignStart({
      now,
      baseIntervalSeconds: 60,
      businessHours: BUSINESS_HOURS,
      mailbox: { dailyCap: 50, rampStartedAt: null },
      domainThrottleLimit: 1,
      alreadySentByMailboxToday: 0,
      enrollments: [
        { id: "a", email: "a@acme.com", timezone: "UTC" },
        { id: "b", email: "b2@acme.com", timezone: "UTC" },
      ],
    });

    expect(result[0].nextSendAt.getUTCDate()).toBe(3);
    expect(result[1].nextSendAt.getUTCDate()).toBe(4);
  });
});
