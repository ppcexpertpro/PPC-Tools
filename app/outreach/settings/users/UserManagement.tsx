"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/shared/Button";
import { useUIStore } from "@/store/uiStore";

interface UserRow {
  id: string;
  email: string;
  role: string;
}

const inputClass =
  "min-h-10 rounded-md border border-border-strong bg-surface px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal";

export function UserManagement({ users, currentUserId }: { users: UserRow[]; currentUserId: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const showToast = useUIStore((state) => state.showToast);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/outreach/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });
      if (!response.ok) {
        showToast("error", "Could not create the user.");
        return;
      }
      setEmail("");
      setPassword("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: string) => {
    const response = await fetch(`/api/outreach/users/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const body = await response.json();
      showToast("error", body.error ?? "Could not remove the user.");
      return;
    }
    router.refresh();
  };

  const handleResetPassword = async (id: string) => {
    const newPassword = window.prompt("New password (min 8 characters):");
    if (!newPassword) return;
    const response = await fetch(`/api/outreach/users/${id}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPassword }),
    });
    if (!response.ok) {
      showToast("error", "Could not reset the password.");
      return;
    }
    showToast("success", "Password reset. They've been signed out everywhere.");
  };

  return (
    <div className="flex flex-col gap-8">
      <ul className="flex flex-col gap-2">
        {users.map((user) => (
          <li
            key={user.id}
            className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4 text-sm"
          >
            <div>
              <span className="font-medium text-ink">{user.email}</span>{" "}
              <span className="font-mono text-xs text-ink-faint">{user.role}</span>
              {user.id === currentUserId && <span className="ml-2 text-xs text-ink-faint">(you)</span>}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => handleResetPassword(user.id)}>
                Reset password
              </Button>
              <Button variant="secondary" onClick={() => handleRemove(user.id)}>
                Remove
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-display text-lg font-semibold text-ink">Add a user</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-ink-muted">
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-ink-muted">
            Temporary password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-ink-muted">
            Role
            <select value={role} onChange={(e) => setRole(e.target.value as "admin" | "member")} className={inputClass}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <Button
            className="self-end"
            loading={loading}
            disabled={!email || password.length < 8}
            onClick={handleCreate}
          >
            Create user
          </Button>
        </div>
      </div>
    </div>
  );
}
