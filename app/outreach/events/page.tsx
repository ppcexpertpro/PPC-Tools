import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { events } from "@/db/schema";
import { PAGE_SIZE, parsePageParam, pageOffset } from "@/lib/outreach/pagination";

export const metadata = { title: "Events | PPC Keyword Utilities Suite" };
export const dynamic = "force-dynamic";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; type?: string }>;
}) {
  const { page: pageParam, type } = await searchParams;
  const page = parsePageParam(pageParam);

  const distinctTypes = await db.selectDistinct({ type: events.type }).from(events);

  // `.where()` must come right after `.from()` in the chain (matching
  // every other query in this codebase) rather than after `.orderBy()`/
  // `.limit()`/`.offset()` - built as two full query branches instead of
  // conditionally patching one in progress.
  const rows = type
    ? await db
        .select()
        .from(events)
        .where(eq(events.type, type))
        .orderBy(desc(events.createdAt))
        .limit(PAGE_SIZE + 1)
        .offset(pageOffset(page))
    : await db.select().from(events).orderBy(desc(events.createdAt)).limit(PAGE_SIZE + 1).offset(pageOffset(page));

  const hasNextPage = rows.length > PAGE_SIZE;
  const pageRows = rows.slice(0, PAGE_SIZE);
  const linkSuffix = type ? `&type=${encodeURIComponent(type)}` : "";

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-12 outline-none sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink">Events</h1>

      <form className="mt-4 flex items-center gap-2 text-sm" action="/outreach/events">
        <label className="flex items-center gap-2 text-ink-muted">
          Type
          <select
            name="type"
            defaultValue={type ?? ""}
            className="min-h-10 rounded-md border border-border-strong bg-surface px-3 text-sm text-ink"
          >
            <option value="">All</option>
            {distinctTypes.map((row) => (
              <option key={row.type} value={row.type}>
                {row.type}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="text-signal underline underline-offset-2">
          Filter
        </button>
      </form>

      <ul className="mt-6 flex flex-col gap-2">
        {pageRows.map((row) => (
          <li key={row.id} className="rounded-2xl border border-border bg-surface p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase text-ink-faint">{row.type}</span>
              <span className="text-xs text-ink-faint">{new Date(row.createdAt).toLocaleString()}</span>
            </div>
            <pre className="mt-2 overflow-x-auto text-xs text-ink-muted">{JSON.stringify(row.payload, null, 2)}</pre>
          </li>
        ))}
        {pageRows.length === 0 && <li className="text-sm text-ink-muted">No events recorded.</li>}
      </ul>

      <div className="mt-4 flex justify-between text-sm">
        {page > 1 ? (
          <Link href={`/outreach/events?page=${page - 1}${linkSuffix}`} className="text-signal underline underline-offset-2">
            Previous
          </Link>
        ) : (
          <span />
        )}
        {hasNextPage && (
          <Link href={`/outreach/events?page=${page + 1}${linkSuffix}`} className="text-signal underline underline-offset-2">
            Next
          </Link>
        )}
      </div>
    </main>
  );
}
