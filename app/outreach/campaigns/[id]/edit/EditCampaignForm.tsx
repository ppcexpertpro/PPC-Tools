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

interface CampaignDraft {
  id: string;
  name: string;
  postalAddress: string;
  businessDays: number[];
  businessHoursStart: number;
  businessHoursEnd: number;
  baseIntervalSeconds: number;
  domainThrottleLimit: number;
  poolMailboxIds: string[];
  steps: StepDraft[];
}

const MAX_STEPS = 5;
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const inputClass =
  "min-h-10 rounded-md border border-border-strong bg-surface px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal";

export function EditCampaignForm({ mailboxes, campaign }: { mailboxes: MailboxOption[]; campaign: CampaignDraft }) {
  const [mailboxIds, setMailboxIds] = useState<string[]>(campaign.poolMailboxIds);
  const [name, setName] = useState(campaign.name);
  const [steps, setSteps] = useState<StepDraft[]>(campaign.steps);
  const [postalAddress, setPostalAddress] = useState(campaign.postalAddress);
  const [businessDays, setBusinessDays] = useState<number[]>(campaign.businessDays);
  const [businessHoursStart, setBusinessHoursStart] = useState(campaign.businessHoursStart);
  const [businessHoursEnd, setBusinessHoursEnd] = useState(campaign.businessHoursEnd);
  const [baseIntervalSeconds, setBaseIntervalSeconds] = useState(campaign.baseIntervalSeconds);
  const [domainThrottleLimit, setDomainThrottleLimit] = useState(campaign.domainThrottleLimit);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const showToast = useUIStore((state) => state.showToast);

  const toggleMailbox = (id: string, checked: boolean) => {
    setMailboxIds((current) => (checked ? [...current, id] : current.filter((existing) => existing !== id)));
  };

  const toggleBusinessDay = (day: number, checked: boolean) => {
    setBusinessDays((current) => (checked ? [...current, day].sort() : current.filter((d) => d !== day)));
  };

  const updateStep = (index: number, patch: Partial<StepDraft>) => {
    setSteps((current) => current.map((step, i) => (i === index ? { ...step, ...patch } : step)));
  };

  const addStep = () => {
    if (steps.length >= MAX_STEPS) return;
    setSteps((current) => [...current, { subjectTemplate: "", bodyTemplate: "", delayDays: 3 }]);
  };

  const removeStep = (index: number) => {
    setSteps((current) => current.filter((_, i) => i !== index));
  };

  const stepsValid = steps.every((step) => step.subjectTemplate && step.bodyTemplate);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/outreach/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mailboxIds,
          name,
          steps,
          postalAddress,
          businessDays,
          businessHoursStart,
          businessHoursEnd,
          baseIntervalSeconds,
          domainThrottleLimit,
        }),
      });
      if (!response.ok) {
        showToast("error", "Could not save changes. Check every field is filled in.");
        return;
      }
      showToast("success", "Campaign updated.");
      router.push(`/outreach/campaigns/${campaign.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 flex flex-col gap-6">
      <fieldset className="flex flex-col gap-1">
        <legend className="text-sm text-ink-muted">Sending from</legend>
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
              <h3 className="font-display text-sm font-semibold text-ink">Step {index + 1}</h3>
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
        Postal address
        <input value={postalAddress} onChange={(e) => setPostalAddress(e.target.value)} className={inputClass} />
      </label>

      <details className="rounded-2xl border border-border bg-surface p-4">
        <summary className="cursor-pointer font-display text-sm font-semibold text-ink">Advanced scheduling</summary>
        <div className="mt-4 flex flex-col gap-4">
          <fieldset className="flex flex-col gap-1">
            <legend className="text-sm text-ink-muted">Business days</legend>
            <div className="mt-1 flex flex-wrap gap-3">
              {DAY_LABELS.map((label, day) => (
                <Checkbox
                  key={day}
                  id={`business-day-${day}`}
                  label={label}
                  checked={businessDays.includes(day)}
                  onChange={(checked) => toggleBusinessDay(day, checked)}
                />
              ))}
            </div>
          </fieldset>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 text-sm text-ink-muted">
              Business hours start
              <input type="number" min={0} max={23} value={businessHoursStart} onChange={(e) => setBusinessHoursStart(Number(e.target.value))} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1 text-sm text-ink-muted">
              Business hours end
              <input type="number" min={1} max={24} value={businessHoursEnd} onChange={(e) => setBusinessHoursEnd(Number(e.target.value))} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1 text-sm text-ink-muted">
              Base interval (seconds)
              <input type="number" min={1} value={baseIntervalSeconds} onChange={(e) => setBaseIntervalSeconds(Number(e.target.value))} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1 text-sm text-ink-muted">
              Per-domain daily limit
              <input type="number" min={1} value={domainThrottleLimit} onChange={(e) => setDomainThrottleLimit(Number(e.target.value))} className={inputClass} />
            </label>
          </div>
        </div>
      </details>

      <Button
        loading={loading}
        disabled={mailboxIds.length === 0 || !name || !stepsValid || !postalAddress || businessDays.length === 0}
        onClick={handleSubmit}
      >
        Save changes
      </Button>
    </div>
  );
}
