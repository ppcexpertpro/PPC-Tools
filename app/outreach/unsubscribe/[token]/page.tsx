import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { enrollments, contacts, suppressions } from "@/db/schema";
import { loadUnsubscribeSecret, verifyUnsubscribeToken } from "@/lib/outreach/unsubscribe/token";

// Never cache: this page performs a write (suppressing the contact) on every
// visit, and must never serve a stale/prerendered response to a recipient.
export const dynamic = "force-dynamic";

async function unsubscribe(token: string): Promise<boolean> {
  const secret = loadUnsubscribeSecret();
  const enrollmentId = verifyUnsubscribeToken(token, secret);
  if (!enrollmentId) return false;

  const [enrollment] = await db
    .select({ contactId: enrollments.contactId })
    .from(enrollments)
    .where(eq(enrollments.id, enrollmentId));
  if (!enrollment) return false;

  const [contact] = await db.select({ email: contacts.email }).from(contacts).where(eq(contacts.id, enrollment.contactId));
  if (contact) {
    await db.insert(suppressions).values({ email: contact.email, reason: "unsubscribed" }).onConflictDoNothing();
  }
  await db.update(enrollments).set({ status: "unsubscribed" }).where(eq(enrollments.id, enrollmentId));
  return true;
}

export default async function UnsubscribePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const success = await unsubscribe(token);

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-lg px-4 py-16 text-center outline-none sm:px-6">
      <h1 className="font-display text-2xl font-bold text-ink">
        {success ? "You're unsubscribed" : "This link is no longer valid"}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-muted">
        {success
          ? "You will not receive any further messages in this sequence."
          : "This unsubscribe link has already been used or is malformed."}
      </p>
    </main>
  );
}
