"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/shared/Button";
import { useUIStore } from "@/store/uiStore";

export function DisconnectMailboxButton({ mailboxId, fromEmail }: { mailboxId: string; fromEmail: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const showToast = useUIStore((state) => state.showToast);

  const handleDisconnect = async () => {
    if (!window.confirm(`Disconnect ${fromEmail}? This cannot be undone.`)) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/outreach/mailboxes/${mailboxId}`, { method: "DELETE" });
      const body = await response.json();
      if (!response.ok) {
        showToast("error", body.error ?? "Could not disconnect this mailbox.");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="secondary" loading={loading} onClick={handleDisconnect}>
      Disconnect
    </Button>
  );
}
