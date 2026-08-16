import Link from "next/link";
import { ArrowRightIcon } from "@/components/shared/icons";

export interface CrossToolPromptProps {
  message: string;
  href: string;
  linkText: string;
}

/** APP-FLOW §2 contextual suggestions pointing a user to their likely next tool. */
export function CrossToolPrompt({
  message,
  href,
  linkText,
}: CrossToolPromptProps) {
  return (
    <p className="rounded-xl border border-border bg-paper px-4 py-3 text-sm text-ink-muted">
      {message}{" "}
      <Link
        href={href}
        className="group inline-flex items-center gap-1 rounded-sm font-medium text-signal underline underline-offset-2 transition-colors duration-200 ease-out hover:text-signal-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      >
        {linkText}
        <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
      </Link>
    </p>
  );
}
