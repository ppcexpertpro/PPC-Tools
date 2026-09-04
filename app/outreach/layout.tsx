import Link from "next/link";
import { getCurrentUser } from "@/lib/outreach/auth/currentUser";
import { SignOutButton } from "./SignOutButton";

export default async function OutreachLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <>
      {user && (
        <div className="border-b border-border bg-paper">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-2 text-sm sm:px-6">
            <span className="text-ink-muted">
              Signed in as <span className="font-medium text-ink">{user.email}</span>
              {user.role === "admin" && (
                <>
                  {" - "}
                  <Link href="/outreach/settings/users" className="text-signal underline underline-offset-2">
                    Manage users
                  </Link>
                </>
              )}
            </span>
            <SignOutButton />
          </div>
        </div>
      )}
      {children}
    </>
  );
}
