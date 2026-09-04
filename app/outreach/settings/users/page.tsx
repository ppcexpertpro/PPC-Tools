import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/outreach/auth/currentUser";
import { UserManagement } from "./UserManagement";

export const metadata = { title: "Manage users | PPC Keyword Utilities Suite" };

export default async function UsersSettingsPage() {
  const currentUser = await getCurrentUser();
  if (currentUser?.role !== "admin") redirect("/outreach");

  const rows = await db.select({ id: users.id, email: users.email, role: users.role }).from(users);

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-2xl px-4 py-12 outline-none sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink">Manage users</h1>
      <div className="mt-8">
        <UserManagement users={rows} currentUserId={currentUser.id} />
      </div>
    </main>
  );
}
