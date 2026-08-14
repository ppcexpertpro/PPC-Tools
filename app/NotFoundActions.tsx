"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/shared/Button";

export function NotFoundActions() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
      <Link
        href="/"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-signal px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-signal-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      >
        Back to tools
      </Link>
      <Button variant="secondary" onClick={() => router.back()}>
        Go back
      </Button>
    </div>
  );
}
