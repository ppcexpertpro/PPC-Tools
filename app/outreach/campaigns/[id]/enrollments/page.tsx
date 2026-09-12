import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { campaigns, contacts, enrollments, mailboxes, messages } from "@/db/schema";
import { PAGE_SIZE, parsePageParam, pageOffset } from "@/lib/outreach/pagination";

export const dynamic = "force-dynamic";

export default async function CampaignEnrollmentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);

  const [campaign] = await db.select({ name: campaigns.name }).from(campaigns).where(eq(campaigns.id, id));
  if (!campaign) notFound();

  const rows = await db
    .select({
      enrollmentId: enrollments.id,
      status: enrollments.status,
      currentStep: enrollments.currentStep,
      nextSendAt: enrollments.nextSendAt,
      contactEmail: contacts.email,
      mailboxFromEmail: mailboxes.fromEmail,
    })
    .from(enrollments)
    .innerJoin(contacts, eq(contacts.id, enrollments.contactId))
    .leftJoin(mailboxes, eq(mailboxes.id, enrollments.mailboxId))
    .where(eq(enrollments.campaignId, id))
    .orderBy(asc(contacts.email))
    .limit(PAGE_SIZE + 1)
    .offset(pageOffset(page));

  const hasNextPage = rows.length > PAGE_SIZE;
  const pageRows = rows.slice(0, PAGE_SIZE);

  const messagesByEnrollment = new Map<string, { rfcMessageId: string; status: string; sentAt: Date; providerThreadId: string | null }[]>();
  if (pageRows.length > 0) {
    const messageRows = await db
      .select({
        enrollmentId: messages.enrollmentId,
        rfcMessageId: messages.rfcMessageId,
        status: messages.status,
        sentAt: messages.sentAt,
        providerThreadId: messages.providerThreadId,
      })
      .from(messages)
      .orderBy(desc(messages.sentAt));
    for (const row of messageRows) {
      if (!pageRows.some((r) => r.enrollmentId === row.enrollmentId)) continue;
      const existing = messagesByEnrollment.get(row.enrollmentId) ?? [];
      existing.push(row);
      messagesByEnrollment.set(row.enrollmentId, existing);
    }
  }

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-4xl px-4 py-12 outline-none sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink">{campaign.name} — contacts</h1>
      <p className="mt-2 text-sm text-ink-faint">
        Message metadata only — the rendered subject/body isn&apos;t stored per send.
      </p>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Step</th>
              <th className="px-4 py-3">Mailbox</th>
              <th className="px-4 py-3">Next send</th>
              <th className="px-4 py-3">Messages</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr key={row.enrollmentId} className="border-b border-border align-top last:border-0">
                <td className="px-4 py-3">{row.contactEmail}</td>
                <td className="px-4 py-3 font-mono text-xs uppercase">{row.status}</td>
                <td className="px-4 py-3">{row.currentStep}</td>
                <td className="px-4 py-3 text-ink-faint">{row.mailboxFromEmail ?? "-"}</td>
                <td className="px-4 py-3 text-ink-faint">{row.nextSendAt ? new Date(row.nextSendAt).toLocaleString() : "-"}</td>
                <td className="px-4 py-3">
                  {(messagesByEnrollment.get(row.enrollmentId) ?? []).map((m) => (
                    <div key={m.rfcMessageId} className="font-mono text-xs text-ink-faint">
                      {m.status} · {new Date(m.sentAt).toLocaleString()}
                    </div>
                  ))}
                  {!messagesByEnrollment.has(row.enrollmentId) && <span className="text-ink-faint">none yet</span>}
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-ink-muted">
                  No contacts imported yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-between text-sm">
        {page > 1 ? (
          <Link href={`/outreach/campaigns/${id}/enrollments?page=${page - 1}`} className="text-signal underline underline-offset-2">
            Previous
          </Link>
        ) : (
          <span />
        )}
        {hasNextPage && (
          <Link href={`/outreach/campaigns/${id}/enrollments?page=${page + 1}`} className="text-signal underline underline-offset-2">
            Next
          </Link>
        )}
      </div>
    </main>
  );
}
