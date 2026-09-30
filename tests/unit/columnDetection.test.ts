import { detectSearchTermColumn } from "@/lib/file-parsing/columnDetection";

describe("detectSearchTermColumn", () => {
  it("auto-selects the single matching column, case-insensitively", () => {
    expect(
      detectSearchTermColumn(["Campaign", "Search Term", "Clicks"]),
    ).toEqual({ status: "found", column: "Search Term" });
  });

  it("matches known aliases: query, keyword, keywords, search terms", () => {
    expect(detectSearchTermColumn(["Query"])).toEqual({
      status: "found",
      column: "Query",
    });
    expect(detectSearchTermColumn(["Keyword"])).toEqual({
      status: "found",
      column: "Keyword",
    });
    expect(detectSearchTermColumn(["Keywords"])).toEqual({
      status: "found",
      column: "Keywords",
    });
    expect(detectSearchTermColumn(["Search terms"])).toEqual({
      status: "found",
      column: "Search terms",
    });
  });

  it("ignores punctuation when normalizing headers", () => {
    expect(detectSearchTermColumn(["Search-Term:"])).toEqual({
      status: "found",
      column: "Search-Term:",
    });
  });

  it("needs manual selection when no column matches", () => {
    expect(detectSearchTermColumn(["Campaign", "Clicks", "Cost"])).toEqual({
      status: "needs-selection",
    });
  });

  it("needs manual selection when multiple columns match", () => {
    expect(detectSearchTermColumn(["Search Term", "Query", "Clicks"])).toEqual({
      status: "needs-selection",
    });
  });

  it("recognises longer headers that name a keyword column", () => {
    expect(detectSearchTermColumn(["Negative Keywords"])).toEqual({
      status: "found",
      column: "Negative Keywords",
    });
    expect(
      detectSearchTermColumn(["Negative Keywords for Day spas PPC Account"]),
    ).toEqual({
      status: "found",
      column: "Negative Keywords for Day spas PPC Account",
    });
  });

  it("prefers an exact header over a longer one that merely mentions keywords", () => {
    expect(detectSearchTermColumn(["Negative Keywords", "Keyword"])).toEqual({
      status: "found",
      column: "Keyword",
    });
  });

  it("still asks when several longer headers could be the keyword column", () => {
    expect(
      detectSearchTermColumn([
        "Negative Keywords",
        "Search Terms Report",
        "Root Keywords",
      ]),
    ).toEqual({ status: "needs-selection" });
  });
});
