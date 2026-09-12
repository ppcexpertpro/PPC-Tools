"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/shared/Button";
import { useUIStore } from "@/store/uiStore";

export function RemoveSuppressionButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const showToast = useUIStore((state) => state.showToast);

  const handleRemove = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/outreach/suppressions/${id}`, { method: "DELETE" });
      if (!response.ok) {
        showToast("error", "Could not remove this suppression.");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="secondary" loading={loading} onClick={handleRemove}>
      Remove
    </Button>
  );
}
