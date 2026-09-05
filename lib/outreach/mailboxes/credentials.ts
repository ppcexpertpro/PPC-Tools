import type { SmtpCredentials } from "@/lib/outreach/transport/smtp";

export interface ImapCredentials {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}

export interface MailboxCredentials {
  smtp: SmtpCredentials;
  imap: ImapCredentials | null;
}

/**
 * Reads a decrypted mailbox credential payload in either shape: the new
 * `{smtp, imap}` object (mailboxes connected on or after Phase 2), or the
 * old flat `{host, port, secure, user, pass}` object (mailboxes connected
 * during Phase 1, before IMAP existed) - which keeps sending mail via SMTP,
 * just with `imap: null` until its owner reconnects it with IMAP details.
 */
export function parseMailboxCredentials(decrypted: string): MailboxCredentials {
  const parsed = JSON.parse(decrypted) as Record<string, unknown>;

  if ("smtp" in parsed) {
    return {
      smtp: parsed.smtp as SmtpCredentials,
      imap: (parsed.imap as ImapCredentials | undefined) ?? null,
    };
  }

  return { smtp: parsed as unknown as SmtpCredentials, imap: null };
}
