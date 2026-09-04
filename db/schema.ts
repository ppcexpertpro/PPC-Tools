import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/** provider: "smtp" | "gmail_oauth" (only "smtp" is used until Phase 3) */
/** health: "healthy" | "degraded" | "paused" */
export const mailboxes = pgTable("mailboxes", {
  id: uuid("id").primaryKey().defaultRandom(),
  provider: text("provider").notNull(),
  fromName: text("from_name").notNull(),
  fromEmail: text("from_email").notNull(),
  encryptedCredentials: text("encrypted_credentials").notNull(),
  dailyCap: integer("daily_cap").notNull().default(50),
  rampStartedAt: timestamp("ramp_started_at", { withTimezone: true }),
  health: text("health").notNull().default("healthy"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** status: "draft" | "active" | "paused" | "completed" */
export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  mailboxId: uuid("mailbox_id")
    .notNull()
    .references(() => mailboxes.id),
  name: text("name").notNull(),
  subjectTemplate: text("subject_template").notNull(),
  bodyTemplate: text("body_template").notNull(),
  postalAddress: text("postal_address").notNull(),
  status: text("status").notNull().default("draft"),
  businessHoursStart: integer("business_hours_start").notNull().default(9),
  businessHoursEnd: integer("business_hours_end").notNull().default(16),
  /** Day-of-week integers, 0=Sunday..6=Saturday. Default Tue/Wed/Thu. */
  businessDays: jsonb("business_days")
    .notNull()
    .default([2, 3, 4])
    .$type<number[]>(),
  baseIntervalSeconds: integer("base_interval_seconds").notNull().default(60),
  domainThrottleLimit: integer("domain_throttle_limit").notNull().default(3),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    fields: jsonb("fields").notNull().default({}).$type<Record<string, string>>(),
    timezone: text("timezone").notNull().default("UTC"),
    consentBasis: text("consent_basis").notNull().default("b2b_legitimate_interest"),
    source: text("source"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("contacts_email_idx").on(table.email)],
);

/** status: "pending" | "active" | "replied" | "bounced" | "unsubscribed" | "completed" | "failed" */
export const enrollments = pgTable(
  "enrollments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id),
    status: text("status").notNull().default("pending"),
    // Nullable: unset while "pending" (imported but campaign not yet started).
    nextSendAt: timestamp("next_send_at", { withTimezone: true }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("enrollments_campaign_contact_idx").on(table.campaignId, table.contactId)],
);

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  enrollmentId: uuid("enrollment_id")
    .notNull()
    .references(() => enrollments.id),
  rfcMessageId: text("rfc_message_id").notNull(),
  status: text("status").notNull().default("sent"),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
});

export const suppressions = pgTable(
  "suppressions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("suppressions_email_idx").on(table.email)],
);

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull(),
  payload: jsonb("payload").notNull().default({}).$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
