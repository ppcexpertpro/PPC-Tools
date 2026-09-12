import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { suppressions } from "@/db/schema";
import { PAGE_SIZE, parsePageParam, pageOffset } from "@/lib/outreach/pagination";
import { SuppressionForm } from "./SuppressionForm";
import { RemoveSuppressionButton } from "./RemoveSuppressionButton";

export const metadata = { title: "Suppressions | PPC Keyword Utilities Suite" };
export const dynamic = "force-dynamic";

export default async function SuppressionsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);

  const rows = await db
    .select()
    .from(suppressions)
    .orderBy(desc(suppressions.createdAt))
    .limit(PAGE_SIZE + 1)
    .offset(pageOffset(page));

  const hasNextPage = rows.length > PAGE_SIZE;
  const pageRows = rows.slice(0, PAGE_SIZE);

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-12 outline-none sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink">Suppressions</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Addresses on this list are never sent to, in any campaign, regardless of import.
      </p>

      <div className="mt-6 rounded-2xl border border-border bg-surface p-4">
        <SuppressionForm />
      </div>

      <ul className="mt-6 flex flex-col gap-2">
        {pageRows.map((row) => (
          <li key={row.id} className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 text-sm">
            <div>
              <span className="font-medium text-ink">{row.email}</span>{" "}
              <span className="text-ink-faint">— {row.reason}</span>
            </div>
            <RemoveSuppressionButton id={row.id} />
          </li>
        ))}
        {pageRows.length === 0 && <li className="text-sm text-ink-muted">No suppressed addresses.</li>}
      </ul>

      <div className="mt-4 flex justify-between text-sm">
        {page > 1 ? (
          <Link href={`/outreach/suppressions?page=${page - 1}`} className="text-signal underline underline-offset-2">
            Previous
          </Link>
        ) : (
          <span />
        )}
        {hasNextPage && (
          <Link href={`/outreach/suppressions?page=${page + 1}`} className="text-signal underline underline-offset-2">
            Next
          </Link>
        )}
      </div>
    </main>
  );
}
