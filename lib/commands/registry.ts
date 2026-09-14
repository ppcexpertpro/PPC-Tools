export interface CommandItem {
  id: string;
  label: string;
  /** Section heading the command is listed under. */
  group: string;
  /** Secondary line shown to the right - says what the destination does. */
  hint?: string;
  /** Extra search terms that never render, for matching words users think in. */
  keywords?: string;
  href: string;
}

/*
 * Every destination in the suite, in the order they're offered on an empty
 * query. This is the whole navigation model for the outreach console: the
 * section has ten pages and a conventional nav bar that lists ten links is
 * how you end up hiding the two nobody remembers exist. Ordered by how often
 * an operator actually reaches for them, not by URL structure.
 */
export const COMMANDS: CommandItem[] = [
  {
    id: "outreach-campaigns",
    label: "Campaigns",
    group: "Outreach",
    hint: "All campaigns and their status",
    keywords: "sequence list outreach",
    href: "/outreach",
  },
  {
    id: "outreach-new-campaign",
    label: "New campaign",
    group: "Outreach",
    hint: "Build a sequence and schedule",
    keywords: "create add compose sequence",
    href: "/outreach/campaigns/new",
  },
  {
    id: "outreach-replies",
    label: "Replies",
    group: "Outreach",
    hint: "Every reply, across every campaign",
    keywords: "inbox thread conversation unsubscribe reply",
    href: "/outreach/replies",
  },
  {
    id: "outreach-dashboard",
    label: "Deliverability dashboard",
    group: "Outreach",
    hint: "Mailbox health, reply rates, worker status",
    keywords: "stats metrics bounce health heartbeat",
    href: "/outreach/dashboard",
  },
  {
    id: "outreach-mailboxes",
    label: "Mailboxes",
    group: "Outreach",
    hint: "Connect and manage sending accounts",
    keywords: "smtp gmail google imap sender connect",
    href: "/outreach/mailboxes",
  },
  {
    id: "outreach-suppressions",
    label: "Suppressions",
    group: "Outreach",
    hint: "Addresses that are never contacted",
    keywords: "blocklist unsubscribe do not contact bounce",
    href: "/outreach/suppressions",
  },
  {
    id: "outreach-events",
    label: "Events",
    group: "Outreach",
    hint: "Audit log of sends, failures and pauses",
    keywords: "log audit history debug activity",
    href: "/outreach/events",
  },
  {
    id: "outreach-users",
    label: "Manage users",
    group: "Outreach",
    hint: "Accounts with access to the console",
    keywords: "accounts team admin permissions settings",
    href: "/outreach/settings/users",
  },

  {
    id: "keyword-match-type",
    label: "Keyword Match Type",
    group: "Keyword tools",
    hint: "Format one list into all four match types",
    keywords: "broad phrase exact bmm brackets quotes",
    href: "/keyword-match-type",
  },
  {
    id: "keyword-merge-match",
    label: "Keyword Merge & Match",
    group: "Keyword tools",
    hint: "Cross-join term groups into keywords",
    keywords: "combine cross join permutation groups",
    href: "/keyword-merge-match",
  },
  {
    id: "negative-keyword-finder",
    label: "Negative Keyword Finder",
    group: "Keyword tools",
    hint: "Mine a search-terms report for waste",
    keywords: "search terms report waste spend csv mine",
    href: "/negative-keyword-finder",
  },

  {
    id: "home",
    label: "Suite home",
    group: "Elsewhere",
    keywords: "index start overview",
    href: "/",
  },
  {
    id: "privacy",
    label: "Privacy policy",
    group: "Elsewhere",
    keywords: "data gdpr legal",
    href: "/privacy",
  },
  {
    id: "terms",
    label: "Terms of use",
    group: "Elsewhere",
    keywords: "legal conditions",
    href: "/terms",
  },
];

/*
 * Ranked substring matching, deliberately not fuzzy. Fuzzy matching earns its
 * keep over hundreds of items; across a fixed list of ~13 it mostly surfaces
 * surprises ("ses" matching "SupprESsionS") and costs the user the ability to
 * predict what typing will do. The four tiers below are ordered by how much
 * of the match the user actually typed at the front of a word.
 *
 * Array.prototype.sort is stable, so items scoring equally stay in registry
 * order - which is why the registry is ordered by expected frequency.
 */
export function filterCommands(commands: CommandItem[], query: string): CommandItem[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return commands;

  const scored: { command: CommandItem; score: number }[] = [];

  for (const command of commands) {
    const label = command.label.toLowerCase();
    const score = scoreCommand(label, command, needle);
    if (score !== null) scored.push({ command, score });
  }

  return scored.sort((a, b) => a.score - b.score).map((entry) => entry.command);
}

function scoreCommand(label: string, command: CommandItem, needle: string): number | null {
  if (label.startsWith(needle)) return 0;
  if (label.split(/[\s&-]+/).some((word) => word.startsWith(needle))) return 1;
  if (label.includes(needle)) return 2;

  const secondary = `${command.keywords ?? ""} ${command.group} ${command.hint ?? ""}`.toLowerCase();
  if (secondary.includes(needle)) return 3;

  return null;
}
