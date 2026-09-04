import { db } from "@/db/client";
import { mailboxes } from "@/db/schema";
import { NewCampaignForm } from "./NewCampaignForm";

export const metadata = { title: "New campaign | PPC Keyword Utilities Suite" };

// See app/outreach/mailboxes/page.tsx for why this is required.
export const dynamic = "force-dynamic";

export default async function NewCampaignPage() {
  const rows = await db
    .select({ id: mailboxes.id, fromName: mailboxes.fromName, fromEmail: mailboxes.fromEmail })
    .from(mailboxes);

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-2xl px-4 py-12 outline-none sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink">New campaign</h1>
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-ink-muted">
          Connect a mailbox first on the{" "}
          <a href="/outreach/mailboxes" className="text-signal underline underline-offset-2">
            mailboxes page
          </a>
          .
        </p>
      ) : (
        <NewCampaignForm mailboxes={rows} />
      )}
    </main>
  );
}
