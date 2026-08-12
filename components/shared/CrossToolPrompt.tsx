import Link from "next/link";

export interface CrossToolPromptProps {
  message: string;
  href: string;
  linkText: string;
}

/** APP-FLOW §2 contextual suggestions pointing a user to their likely next tool. */
export function CrossToolPrompt({ message, href, linkText }: CrossToolPromptProps) {
  return (
    <p className="rounded-lg border border-border bg-paper p-3 text-sm text-ink-muted">
      {message}{" "}
      <Link
        href={href}
        className="font-medium text-signal underline underline-offset-2"
      >
        {linkText}
      </Link>
    </p>
  );
}
