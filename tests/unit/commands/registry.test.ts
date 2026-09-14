import { COMMANDS, filterCommands, type CommandItem } from "@/lib/commands/registry";

const fixtures: CommandItem[] = [
  { id: "campaigns", label: "Campaigns", group: "Outreach", href: "/outreach" },
  {
    id: "new-campaign",
    label: "New campaign",
    group: "Outreach",
    href: "/outreach/campaigns/new",
  },
  {
    id: "suppressions",
    label: "Suppressions",
    group: "Outreach",
    keywords: "blocklist unsubscribe",
    href: "/outreach/suppressions",
  },
  {
    id: "merge",
    label: "Keyword Merge & Match",
    group: "Keyword tools",
    href: "/keyword-merge-match",
  },
];

describe("filterCommands", () => {
  it("returns every command, in registry order, for an empty query", () => {
    expect(filterCommands(fixtures, "")).toEqual(fixtures);
    expect(filterCommands(fixtures, "   ")).toEqual(fixtures);
  });

  it("ranks a label prefix above a match on a later word", () => {
    const results = filterCommands(fixtures, "camp");

    expect(results.map((command) => command.id)).toEqual(["campaigns", "new-campaign"]);
  });

  it("matches a word inside the label that isn't the first", () => {
    expect(filterCommands(fixtures, "match").map((c) => c.id)).toEqual(["merge"]);
  });

  it("matches hidden keywords the label never shows", () => {
    expect(filterCommands(fixtures, "blocklist").map((c) => c.id)).toEqual(["suppressions"]);
  });

  it("ranks a label match above a keyword-only match", () => {
    const results = filterCommands(
      [
        { id: "keyword-only", label: "Events", group: "Outreach", keywords: "mailbox", href: "/a" },
        { id: "label", label: "Mailboxes", group: "Outreach", href: "/b" },
      ],
      "mailbox",
    );

    expect(results.map((command) => command.id)).toEqual(["label", "keyword-only"]);
  });

  it("is case insensitive and ignores surrounding whitespace", () => {
    expect(filterCommands(fixtures, "  SUPPR  ").map((c) => c.id)).toEqual(["suppressions"]);
  });

  it("returns nothing when no command matches", () => {
    expect(filterCommands(fixtures, "zzzz")).toEqual([]);
  });
});

describe("COMMANDS registry", () => {
  it("has no duplicate ids, since they key the rendered list", () => {
    const ids = COMMANDS.map((command) => command.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("points every command at an app-relative path", () => {
    for (const command of COMMANDS) {
      expect(command.href.startsWith("/")).toBe(true);
    }
  });

  it("reaches the two pages that had no inbound links before the redesign", () => {
    const hrefs = COMMANDS.map((command) => command.href);

    expect(hrefs).toContain("/outreach/suppressions");
    expect(hrefs).toContain("/outreach/events");
  });
});
