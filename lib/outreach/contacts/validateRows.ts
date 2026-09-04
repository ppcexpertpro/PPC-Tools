export interface ContactRowInput {
  email: string;
  fields: Record<string, string>;
}

export interface ContactValidationResult {
  valid: ContactRowInput[];
  invalid: { row: number; email: string; reason: string }[];
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContactRows(
  rows: Record<string, string>[],
  emailColumn: string,
): ContactValidationResult {
  const valid: ContactRowInput[] = [];
  const invalid: ContactValidationResult["invalid"] = [];
  const seen = new Set<string>();

  rows.forEach((row, index) => {
    const rawEmail = (row[emailColumn] ?? "").trim();
    const email = rawEmail.toLowerCase();

    if (!rawEmail) {
      invalid.push({ row: index, email: rawEmail, reason: "Missing email address" });
      return;
    }
    if (!EMAIL_PATTERN.test(rawEmail)) {
      invalid.push({ row: index, email: rawEmail, reason: "Invalid email address" });
      return;
    }
    if (seen.has(email)) {
      invalid.push({ row: index, email: rawEmail, reason: "Duplicate within this file" });
      return;
    }
    seen.add(email);

    const fields: Record<string, string> = {};
    for (const [key, value] of Object.entries(row)) {
      if (key !== emailColumn) fields[key] = value;
    }
    valid.push({ email, fields });
  });

  return { valid, invalid };
}
