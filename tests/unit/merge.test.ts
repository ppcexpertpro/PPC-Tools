import { mergeGroups, MAX_MERGE_COMBINATIONS } from "@/lib/algorithms/merge";

describe("mergeGroups", () => {
  it("builds the cartesian product in on-screen group order", () => {
    const result = mergeGroups([
      { label: "Modifiers", lines: ["best", "cheap"] },
      { label: "Core", lines: ["running shoes"] },
    ]);

    expect(result).toEqual({
      status: "ok",
      combinations: ["best running shoes", "cheap running shoes"],
      count: 2,
    });
  });

  it("skips an empty group entirely rather than blocking the merge", () => {
    const result = mergeGroups([
      { label: "Modifiers", lines: ["best", "cheap"] },
      { label: "Core", lines: ["running shoes"] },
      { label: "Suffix", lines: [] },
    ]);

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.count).toBe(2);
    }
  });

  it("treats a whitespace-only group as empty too", () => {
    const result = mergeGroups([
      { label: "Modifiers", lines: ["best"] },
      { label: "Core", lines: ["running shoes"] },
      { label: "Suffix", lines: ["   ", ""] },
    ]);

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.combinations).toEqual(["best running shoes"]);
    }
  });

  it("reports needs-more-groups when only one group has content", () => {
    const result = mergeGroups([
      { label: "Modifiers", lines: ["best", "cheap"] },
      { label: "Core", lines: [] },
    ]);
    expect(result).toEqual({ status: "needs-more-groups" });
  });

  it("reports needs-more-groups for a single group entirely", () => {
    const result = mergeGroups([{ label: "Modifiers", lines: ["best"] }]);
    expect(result).toEqual({ status: "needs-more-groups" });
  });

  it("dedupes within a group before the cartesian product runs, regardless of removeDuplicates", () => {
    const result = mergeGroups([
      { label: "Modifiers", lines: ["best", "Best", "BEST"] },
      { label: "Core", lines: ["running shoes"] },
    ]);

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.combinations).toEqual(["best running shoes"]);
    }
  });

  it("caps predicted combinations at 20,000 and reports the would-be count", () => {
    const bigGroup = Array.from({ length: 200 }, (_, i) => `term${i}`);
    const result = mergeGroups([
      { label: "A", lines: bigGroup },
      { label: "B", lines: bigGroup },
    ]);

    expect(result).toEqual({
      status: "too-many-combinations",
      predictedCount: 40000,
    });
  });

  it("allows exactly the 20,000-combination cap", () => {
    const groupA = Array.from({ length: 200 }, (_, i) => `a${i}`);
    const groupB = Array.from({ length: 100 }, (_, i) => `b${i}`);
    const result = mergeGroups([
      { label: "A", lines: groupA },
      { label: "B", lines: groupB },
    ]);

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.count).toBe(MAX_MERGE_COMBINATIONS);
    }
  });

  it("removes duplicate resulting keywords when two different group combinations produce an identical merged string", () => {
    // "foo" + "bar baz" and "foo bar" + "baz" both merge to "foo bar baz".
    const withoutDedupe = mergeGroups([
      { label: "A", lines: ["foo bar", "foo"] },
      { label: "B", lines: ["baz", "bar baz"] },
    ]);
    expect(withoutDedupe.status).toBe("ok");
    if (withoutDedupe.status === "ok") {
      expect(withoutDedupe.combinations).toEqual([
        "foo bar baz",
        "foo bar bar baz",
        "foo baz",
        "foo bar baz",
      ]);
    }

    const withDedupe = mergeGroups(
      [
        { label: "A", lines: ["foo bar", "foo"] },
        { label: "B", lines: ["baz", "bar baz"] },
      ],
      { removeDuplicates: true },
    );
    expect(withDedupe.status).toBe("ok");
    if (withDedupe.status === "ok") {
      expect(withDedupe.combinations).toEqual([
        "foo bar baz",
        "foo bar bar baz",
        "foo baz",
      ]);
      expect(withDedupe.count).toBe(3);
    }
  });

  it("lowercases combinations when the lowercase option is on", () => {
    const result = mergeGroups(
      [
        { label: "A", lines: ["Best"] },
        { label: "B", lines: ["Running Shoes"] },
      ],
      { lowercase: true },
    );
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.combinations).toEqual(["best running shoes"]);
    }
  });

  it("removeExtraSymbols collapses whitespace and strips disallowed characters", () => {
    const result = mergeGroups(
      [
        { label: "A", lines: ["Men's #1"] },
        { label: "B", lines: ["shoes!!"] },
      ],
      { removeExtraSymbols: true },
    );
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.combinations).toEqual(["Men's 1 shoes"]);
    }
  });
});
