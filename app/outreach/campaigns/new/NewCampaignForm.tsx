"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/shared/Button";
import { Textarea } from "@/components/shared/Textarea";
import { useUIStore } from "@/store/uiStore";

interface MailboxOption {
  id: string;
  fromName: string;
  fromEmail: string;
}

const inputClass =
  "min-h-10 rounded-md border border-border-strong bg-surface px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal";

export function NewCampaignForm({ mailboxes }: { mailboxes: MailboxOption[] }) {
  const [mailboxId, setMailboxId] = useState(mailboxes[0]?.id ?? "");
  const [name, setName] = useState("");
  const [subjectTemplate, setSubjectTemplate] = useState("");
  const [bodyTemplate, setBodyTemplate] = useState(
    "Hi {{first_name}},\n\n\n\nUnsubscribe: {{unsubscribe_token}}",
  );
  const [postalAddress, setPostalAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const showToast = useUIStore((state) => state.showToast);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/outreach/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mailboxId, name, subjectTemplate, bodyTemplate, postalAddress }),
      });
      const body = await response.json();
      if (!response.ok) {
        showToast("error", "Could not create the campaign. Check every field is filled in.");
        return;
      }
      router.push(`/outreach/campaigns/${body.campaign.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm text-ink-muted">
        Sending from
        <select value={mailboxId} onChange={(e) => setMailboxId(e.target.value)} className={inputClass}>
          {mailboxes.map((mailbox) => (
            <option key={mailbox.id} value={mailbox.id}>
              {mailbox.fromName} &lt;{mailbox.fromEmail}&gt;
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm text-ink-muted">
        Campaign name
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
      </label>

      <label className="flex flex-col gap-1 text-sm text-ink-muted">
        Subject
        <input
          value={subjectTemplate}
          onChange={(e) => setSubjectTemplate(e.target.value)}
          placeholder="Quick question about {{company}}"
          className={inputClass}
        />
      </label>

      <Textarea id="body-template" label="Body" value={bodyTemplate} onChange={setBodyTemplate} hideCount rows={10} />

      <label className="flex flex-col gap-1 text-sm text-ink-muted">
        Postal address (required by CAN-SPAM)
        <input value={postalAddress} onChange={(e) => setPostalAddress(e.target.value)} className={inputClass} />
      </label>

      <Button
        loading={loading}
        disabled={!mailboxId || !name || !subjectTemplate || !bodyTemplate || !postalAddress}
        onClick={handleSubmit}
      >
        Create campaign
      </Button>
    </div>
  );
}
