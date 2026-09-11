"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/shared/Button";
import { Checkbox } from "@/components/shared/Checkbox";
import { Textarea } from "@/components/shared/Textarea";
import { useUIStore } from "@/store/uiStore";

interface MailboxOption {
  id: string;
  fromName: string;
  fromEmail: string;
}

interface StepDraft {
  subjectTemplate: string;
  bodyTemplate: string;
  delayDays: number;
}

const MAX_STEPS = 5;
const DEFAULT_BODY = "Hi {{first_name}},\n\n\n\nUnsubscribe: {{unsubscribe_token}}";

const inputClass =
  "min-h-10 rounded-md border border-border-strong bg-surface px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal";

function makeStep(delayDays: number): StepDraft {
  return { subjectTemplate: "", bodyTemplate: DEFAULT_BODY, delayDays };
}

export function NewCampaignForm({ mailboxes }: { mailboxes: MailboxOption[] }) {
  const [mailboxIds, setMailboxIds] = useState<string[]>(mailboxes[0] ? [mailboxes[0].id] : []);
  const [name, setName] = useState("");
  const [steps, setSteps] = useState<StepDraft[]>([makeStep(0)]);
  const [postalAddress, setPostalAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const showToast = useUIStore((state) => state.showToast);

  const toggleMailbox = (id: string, checked: boolean) => {
    setMailboxIds((current) => (checked ? [...current, id] : current.filter((existing) => existing !== id)));
  };

  const updateStep = (index: number, patch: Partial<StepDraft>) => {
    setSteps((current) => current.map((step, i) => (i === index ? { ...step, ...patch } : step)));
  };

  const addStep = () => {
    if (steps.length >= MAX_STEPS) return;
    setSteps((current) => [...current, makeStep(3)]);
  };

  const removeStep = (index: number) => {
    setSteps((current) => current.filter((_, i) => i !== index));
  };

  const stepsValid = steps.every((step) => step.subjectTemplate && step.bodyTemplate);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/outreach/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mailboxIds, name, steps, postalAddress }),
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
    <div className="mt-6 flex flex-col gap-6">
      <fieldset className="flex flex-col gap-1">
        <legend className="text-sm text-ink-muted">Sending from (pick one or more - each new contact is assigned whichever is least loaded)</legend>
        <div className="mt-2 flex flex-col gap-1 rounded-md border border-border-strong bg-surface p-2">
          {mailboxes.map((mailbox) => (
            <Checkbox
              key={mailbox.id}
              id={`mailbox-${mailbox.id}`}
              label={`${mailbox.fromName} <${mailbox.fromEmail}>`}
              checked={mailboxIds.includes(mailbox.id)}
              onChange={(checked) => toggleMailbox(mailbox.id, checked)}
            />
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1 text-sm text-ink-muted">
        Campaign name
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
      </label>

      <div className="flex flex-col gap-4">
        {steps.map((step, index) => (
          <div key={index} className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-ink">
                Step {index + 1}
                {index > 0 && (
                  <span className="ml-2 font-normal text-ink-faint">(sent this many days after step {index})</span>
                )}
              </h3>
              {steps.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeStep(index)}
                  className="text-xs text-ink-faint underline underline-offset-2 hover:text-danger"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="mt-3 flex flex-col gap-3">
              {index > 0 && (
                <label className="flex flex-col gap-1 text-sm text-ink-muted">
                  Delay (days)
                  <input
                    type="number"
                    min={1}
                    value={step.delayDays}
                    onChange={(e) => updateStep(index, { delayDays: Number(e.target.value) })}
                    className={`${inputClass} max-w-32`}
                  />
                </label>
              )}
              <label className="flex flex-col gap-1 text-sm text-ink-muted">
                Subject
                <input
                  value={step.subjectTemplate}
                  onChange={(e) => updateStep(index, { subjectTemplate: e.target.value })}
                  placeholder="Quick question about {{company}}"
                  className={inputClass}
                />
              </label>
              <Textarea
                id={`body-template-${index}`}
                label="Body"
                value={step.bodyTemplate}
                onChange={(value) => updateStep(index, { bodyTemplate: value })}
                hideCount
                rows={8}
              />
            </div>
          </div>
        ))}

        {steps.length < MAX_STEPS && (
          <Button variant="secondary" onClick={addStep}>
            Add follow-up step
          </Button>
        )}
      </div>

      <label className="flex flex-col gap-1 text-sm text-ink-muted">
        Postal address (required by CAN-SPAM)
        <input value={postalAddress} onChange={(e) => setPostalAddress(e.target.value)} className={inputClass} />
      </label>

      <Button
        loading={loading}
        disabled={mailboxIds.length === 0 || !name || !stepsValid || !postalAddress}
        onClick={handleSubmit}
      >
        Create campaign
      </Button>
    </div>
  );
}
