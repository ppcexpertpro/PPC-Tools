import { NextResponse } from "next/server";
import { z } from "zod";
import { inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { contacts, enrollments } from "@/db/schema";
import { importContactsSchema } from "@/lib/outreach/contacts/importSchema";
import { validateContactRows } from "@/lib/outreach/contacts/validateRows";
import { dedupeContacts } from "@/lib/outreach/contacts/dedupe";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = importContactsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: z.flattenError(parsed.error) }, { status: 400 });
  }
  const { campaignId, emailColumn, rows } = parsed.data;

  const { valid, invalid } = validateContactRows(rows, emailColumn);
  const { toInsert, skippedExisting, skippedSuppressed } = await dedupeContacts(valid);

  const insertedIds: string[] = [];
  if (toInsert.length > 0) {
    const inserted = await db
      .insert(contacts)
      .values(toInsert.map((row) => ({ email: row.email, fields: row.fields })))
      .returning({ id: contacts.id });
    insertedIds.push(...inserted.map((r) => r.id));
  }

  // Rows that matched an existing contact still need enrolling in *this*
  // campaign — they were only skipped from re-insertion, not from sending.
  let reenrolledIds: string[] = [];
  if (skippedExisting.length > 0) {
    const existingRows = await db
      .select({ id: contacts.id, email: contacts.email })
      .from(contacts)
      .where(inArray(contacts.email, skippedExisting));
    const byEmail = new Map(existingRows.map((r) => [r.email, r.id]));
    reenrolledIds = skippedExisting.map((email) => byEmail.get(email)).filter((id): id is string => Boolean(id));
  }

  const allContactIds = [...insertedIds, ...reenrolledIds];
  if (allContactIds.length > 0) {
    await db
      .insert(enrollments)
      .values(allContactIds.map((contactId) => ({ campaignId, contactId, status: "pending" as const })))
      .onConflictDoNothing();
  }

  return NextResponse.json({ imported: allContactIds.length, invalidRows: invalid, skippedSuppressed });
}
