import { buildKeywordList, allSelectableValues } from "@/lib/algorithms/keywordList";

describe("buildKeywordList", () => {
  it("lists each keyword with its individual words underneath", () => {
    expect(buildKeywordList(["no charge", "games"])).toEqual([
      { phrase: "no charge", words: ["no", "charge"] },
      { phrase: "games", words: [] },
    ]);
  });

  it("keeps input order, skips blank lines and drops duplicate keywords", () => {
    expect(
      buildKeywordList(["Free", "", "   ", "youtube", "free "]).map(
        (entry) => entry.phrase,
      ),
    ).toEqual(["free", "youtube"]);
  });

  it("strips phrase/exact match wrappers pasted from an existing negative list", () => {
    expect(
      buildKeywordList([
        '"lowes fence installation"',
        "[corporate website design inspiration 2017]",
      ]).map((entry) => entry.phrase),
    ).toEqual([
      "lowes fence installation",
      "corporate website design inspiration 2017",
    ]);
  });

  it("keeps version numbers and dotted names intact", () => {
    expect(buildKeywordList(["windows 8.1", "limo g.l.inc"])).toEqual([
      { phrase: "windows 8.1", words: ["windows", "8.1"] },
      { phrase: "limo g.l.inc", words: ["limo", "g.l.inc"] },
    ]);
  });

  it("lists a repeated word only once under its keyword", () => {
    expect(buildKeywordList(["car car wash"])).toEqual([
      { phrase: "car car wash", words: ["car", "wash"] },
    ]);
  });
});

describe("allSelectableValues", () => {
  it("returns every keyword and word once, in list order", () => {
    const list = buildKeywordList(["no charge", "no cost", "free"]);
    expect(allSelectableValues(list)).toEqual([
      "no charge",
      "no",
      "charge",
      "no cost",
      "cost",
      "free",
    ]);
  });
});
