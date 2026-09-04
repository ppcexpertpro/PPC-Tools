import { getTableConfig, type PgTable } from "drizzle-orm/pg-core";
import {
  mailboxes,
  campaigns,
  contacts,
  enrollments,
  messages,
  suppressions,
  events,
  users,
  sessions,
} from "@/db/schema";

function columnNames(table: PgTable) {
  return getTableConfig(table).columns.map((column) => column.name);
}

describe("outreach db schema", () => {
  it("defines the expected mailbox columns", () => {
    expect(columnNames(mailboxes)).toEqual(
      expect.arrayContaining([
        "id",
        "provider",
        "from_name",
        "from_email",
        "encrypted_credentials",
        "daily_cap",
        "ramp_started_at",
        "health",
        "created_at",
      ]),
    );
  });

  it("defines the expected campaign columns", () => {
    expect(columnNames(campaigns)).toEqual(
      expect.arrayContaining([
        "id",
        "mailbox_id",
        "name",
        "subject_template",
        "body_template",
        "postal_address",
        "status",
        "business_hours_start",
        "business_hours_end",
        "business_days",
        "base_interval_seconds",
        "domain_throttle_limit",
      ]),
    );
  });

  it("defines the expected contact columns", () => {
    expect(columnNames(contacts)).toEqual(
      expect.arrayContaining(["id", "email", "fields", "timezone", "consent_basis", "source"]),
    );
  });

  it("defines the expected enrollment columns", () => {
    expect(columnNames(enrollments)).toEqual(
      expect.arrayContaining(["id", "campaign_id", "contact_id", "status", "next_send_at", "sent_at"]),
    );
  });

  it("defines the expected message, suppression, and event columns", () => {
    expect(columnNames(messages)).toEqual(
      expect.arrayContaining(["id", "enrollment_id", "rfc_message_id", "status", "sent_at"]),
    );
    expect(columnNames(suppressions)).toEqual(expect.arrayContaining(["id", "email", "reason"]));
    expect(columnNames(events)).toEqual(expect.arrayContaining(["id", "type", "payload"]));
  });

  it("defines the expected user and session columns", () => {
    expect(columnNames(users)).toEqual(
      expect.arrayContaining(["id", "email", "password_hash", "role", "created_at"]),
    );
    expect(columnNames(sessions)).toEqual(
      expect.arrayContaining(["id", "user_id", "token_hash", "expires_at", "created_at"]),
    );
  });
});
