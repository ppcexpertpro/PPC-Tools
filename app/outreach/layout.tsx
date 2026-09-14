import Link from "next/link";
import { getCurrentUser } from "@/lib/outreach/auth/currentUser";
import { OutreachNav } from "@/components/outreach/OutreachNav";
import { SignOutButton } from "./SignOutButton";

export default async function OutreachLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <>
      {/* No user means login or first-run setup, which get no console chrome. */}
      {user && (
        <div className="border-b border-border bg-paper">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-2.5 sm:px-6">
            <OutreachNav />

            <div className="flex items-center gap-3 text-sm">
              {user.role === "admin" && (
                <Link
                  href="/outreach/settings/users"
                  className="rounded-md text-ink-muted transition-colors duration-200 ease-out hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                >
                  Users
                </Link>
              )}
              <span className="hidden text-ink-faint sm:inline" title={user.email}>
                {user.email}
              </span>
              <SignOutButton />
            </div>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
