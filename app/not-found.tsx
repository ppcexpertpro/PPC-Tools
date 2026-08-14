import type { Metadata } from "next";
import { NotFoundActions } from "./NotFoundActions";

export const metadata: Metadata = {
  title: "Page Not Found | PPC Keyword Utilities Suite",
  description: "The page you're looking for doesn't exist or has moved.",
};

export default function NotFound() {
  return (
    <main className="relative flex min-h-[60vh] flex-col items-center justify-center overflow-hidden px-4 py-16 text-center sm:px-6">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex select-none items-center justify-center text-[16rem] font-bold tracking-tight text-transparent [-webkit-text-stroke:2px_var(--color-border-strong)] sm:text-[22rem]"
      >
        404
      </span>

      <div className="relative z-10 flex max-w-md flex-col items-center gap-8">
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Page not found
          </h1>
          <p className="text-lg text-ink-muted">
            The page you&apos;re looking for doesn&apos;t exist or has moved.
          </p>
        </div>

        <NotFoundActions />
      </div>
    </main>
  );
}
