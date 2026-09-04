"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dropzone } from "@/components/shared/Dropzone";
import { Button } from "@/components/shared/Button";
import { useUIStore } from "@/store/uiStore";
import { parseCsv, type ParsedFile } from "@/lib/file-parsing/csv";

export function ImportContactsForm({ campaignId }: { campaignId: string }) {
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [emailColumn, setEmailColumn] = useState("");
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const showToast = useUIStore((state) => state.showToast);

  const handleFile = async (file: File) => {
    setStatus("uploading");
    try {
      const result = await parseCsv(file);
      setParsed(result);
      const guess = result.headers.find((h) => h.toLowerCase().includes("email"));
      setEmailColumn(guess ?? result.headers[0] ?? "");
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  };

  const handleImport = async () => {
    if (!parsed || !emailColumn) return;
    setLoading(true);
    try {
      const response = await fetch("/api/outreach/contacts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, emailColumn, rows: parsed.rows }),
      });
      const body = await response.json();
      if (!response.ok) {
        showToast("error", "Import failed. Check the file and try again.");
        return;
      }
      showToast("success", `Imported ${body.imported} contacts. ${body.invalidRows.length} rows skipped.`);
      setParsed(null);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Dropzone
        accept=".csv"
        status={status}
        onFileSelected={handleFile}
        helperText="CSV with an email column and any merge fields, e.g. first_name."
        errorMessage="Could not read that file as CSV."
      />

      {parsed && (
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
          <label className="flex flex-col gap-1 text-sm text-ink-muted">
            Which column is the email address?
            <select
              value={emailColumn}
              onChange={(event) => setEmailColumn(event.target.value)}
              className="min-h-10 rounded-md border border-border-strong bg-surface px-3 text-sm text-ink"
            >
              {parsed.headers.map((header) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </label>
          <p className="text-xs text-ink-faint">{parsed.rows.length} rows detected.</p>
          <Button loading={loading} onClick={handleImport}>
            Import {parsed.rows.length} contacts
          </Button>
        </div>
      )}
    </div>
  );
}
