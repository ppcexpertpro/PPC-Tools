import { tokenizeAndCount } from "@/lib/algorithms/tokenize";

describe("tokenizeAndCount", () => {
  it("counts unigram frequency across rows", () => {
    const result = tokenizeAndCount(
      ["running shoes", "running boots", "running shoes"],
      [1],
      { hideStopwords: false, minLength: 1, minFrequency: 1 },
    );

    expect(result[1]).toEqual([
      { token: "running", count: 3, pctOfRows: 1 },
      { token: "shoes", count: 2, pctOfRows: 2 / 3 },
      { token: "boots", count: 1, pctOfRows: 1 / 3 },
    ]);
  });

  it("counts overlapping bigrams within a row", () => {
    const result = tokenizeAndCount(["red running shoes"], [2], {
      hideStopwords: false,
      minLength: 1,
      minFrequency: 1,
    });

    expect(result[2]).toEqual(
      expect.arrayContaining([
        { token: "red running", count: 1, pctOfRows: 1 },
        { token: "running shoes", count: 1, pctOfRows: 1 },
      ]),
    );
    expect(result[2]).toHaveLength(2);
  });

  it("counts trigrams", () => {
    const result = tokenizeAndCount(["red running shoes sale"], [3], {
      hideStopwords: false,
      minLength: 1,
      minFrequency: 1,
    });

    expect(result[3]).toEqual([
      { token: "red running shoes", count: 1, pctOfRows: 1 },
      { token: "running shoes sale", count: 1, pctOfRows: 1 },
    ]);
  });

  it("skips empty/whitespace-only rows without counting them toward totals", () => {
    const result = tokenizeAndCount(["running shoes", "", "   "], [1], {
      hideStopwords: false,
      minLength: 1,
      minFrequency: 1,
    });

    // pctOfRows denominator should be 1 (only the non-blank row), not 3.
    expect(result[1]).toEqual(
      expect.arrayContaining([{ token: "running", count: 1, pctOfRows: 1 }]),
    );
  });

  it("is case-insensitive", () => {
    const result = tokenizeAndCount(["Running SHOES", "running shoes"], [1], {
      hideStopwords: false,
      minLength: 1,
      minFrequency: 1,
    });

    expect(result[1]).toEqual(
      expect.arrayContaining([{ token: "running", count: 2, pctOfRows: 1 }]),
    );
  });

  it("hides a unigram that is itself a stopword", () => {
    const result = tokenizeAndCount(["shoes for men"], [1], {
      hideStopwords: true,
      minLength: 1,
      minFrequency: 1,
    });

    expect(result[1]?.map((row) => row.token)).not.toContain("for");
  });

  it("keeps a bigram containing one stopword and one meaningful word", () => {
    const result = tokenizeAndCount(["buy the shoes"], [2], {
      hideStopwords: true,
      minLength: 1,
      minFrequency: 1,
    });

    // "buy the" mixes a real word with a stopword - kept.
    expect(result[2]?.map((row) => row.token)).toContain("buy the");
    // "the shoes" also mixes - kept.
    expect(result[2]?.map((row) => row.token)).toContain("the shoes");
  });

  it("filters a bigram made entirely of stopwords", () => {
    const result = tokenizeAndCount(["shoes for the win"], [2], {
      hideStopwords: true,
      minLength: 1,
      minFrequency: 1,
    });

    expect(result[2]?.map((row) => row.token)).not.toContain("for the");
  });

  it("filters tokens shorter than minLength", () => {
    const result = tokenizeAndCount(["ab cd running shoes"], [1], {
      hideStopwords: false,
      minLength: 3,
      minFrequency: 1,
    });

    const tokens = result[1]?.map((row) => row.token) ?? [];
    expect(tokens).not.toContain("ab");
    expect(tokens).not.toContain("cd");
    expect(tokens).toContain("running");
  });

  it("filters tokens below minFrequency", () => {
    const result = tokenizeAndCount(["shoes", "shoes", "boots"], [1], {
      hideStopwords: false,
      minLength: 1,
      minFrequency: 2,
    });

    const tokens = result[1]?.map((row) => row.token) ?? [];
    expect(tokens).toEqual(["shoes"]);
  });

  it("sorts results by count descending", () => {
    const result = tokenizeAndCount(["a", "b", "b", "c", "c", "c"], [1], {
      hideStopwords: false,
      minLength: 1,
      minFrequency: 1,
    });

    expect(result[1]?.map((row) => row.token)).toEqual(["c", "b", "a"]);
  });

  it("processes multiple n-gram sizes independently in one call", () => {
    const result = tokenizeAndCount(["running shoes"], [1, 2], {
      hideStopwords: false,
      minLength: 1,
      minFrequency: 1,
    });

    expect(result[1]?.map((row) => row.token).sort()).toEqual([
      "running",
      "shoes",
    ]);
    expect(result[2]?.map((row) => row.token)).toEqual(["running shoes"]);
  });
});
