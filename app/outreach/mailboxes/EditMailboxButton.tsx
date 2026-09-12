"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/shared/Button";
import { useUIStore } from "@/store/uiStore";

export function EditMailboxButton({ mailboxId, fromName, dailyCap }: { mailboxId: string; fromName: string; dailyCap: number }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const showToast = useUIStore((state) => state.showToast);

  const handleEdit = async () => {
    const newFromName = window.prompt("Display name:", fromName);
    if (newFromName === null) return;
    const newDailyCapRaw = window.prompt("Daily send cap:", String(dailyCap));
    if (newDailyCapRaw === null) return;
    const newDailyCap = Number(newDailyCapRaw);
    if (!Number.isInteger(newDailyCap) || newDailyCap <= 0) {
      showToast("error", "Daily cap must be a positive whole number.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/outreach/mailboxes/${mailboxId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromName: newFromName, dailyCap: newDailyCap }),
      });
      if (!response.ok) {
        showToast("error", "Could not update this mailbox.");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="secondary" loading={loading} onClick={handleEdit}>
      Edit
    </Button>
  );
}
