"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/shared/Button";
import { Checkbox } from "@/components/shared/Checkbox";
import { useUIStore } from "@/store/uiStore";

const inputClass =
  "min-h-10 rounded-md border border-border-strong bg-surface px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal";

export function MailboxForm() {
  const [fromName, setFromName] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [host, setHost] = useState("");
  const [port, setPort] = useState(587);
  const [secure, setSecure] = useState(false);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [dailyCap, setDailyCap] = useState(15);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const showToast = useUIStore((state) => state.showToast);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/outreach/mailboxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "smtp",
          fromName,
          fromEmail,
          dailyCap,
          smtp: { host, port, secure, user, pass },
        }),
      });
      const responseBody = await response.json();
      if (!response.ok) {
        showToast("error", responseBody.error?.formErrors?.[0] ?? "Could not connect to that mailbox.");
        return;
      }
      showToast("success", "Mailbox connected.");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-sm text-ink-muted">
        From name
        <input value={fromName} onChange={(e) => setFromName(e.target.value)} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm text-ink-muted">
        From email
        <input value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm text-ink-muted">
        SMTP host
        <input value={host} onChange={(e) => setHost(e.target.value)} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm text-ink-muted">
        SMTP port
        <input
          type="number"
          value={port}
          onChange={(e) => setPort(Number(e.target.value))}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-ink-muted">
        Username
        <input value={user} onChange={(e) => setUser(e.target.value)} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm text-ink-muted">
        Password / app password
        <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm text-ink-muted">
        Daily send cap
        <input
          type="number"
          value={dailyCap}
          onChange={(e) => setDailyCap(Number(e.target.value))}
          className={inputClass}
        />
      </label>
      <Checkbox id="smtp-secure" label="Use TLS" checked={secure} onChange={setSecure} className="sm:col-span-2" />
      <Button
        className="sm:col-span-2"
        loading={loading}
        disabled={!fromName || !fromEmail || !host || !user || !pass}
        onClick={handleSubmit}
      >
        Connect mailbox
      </Button>
    </div>
  );
}
