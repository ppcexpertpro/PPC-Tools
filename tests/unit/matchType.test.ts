import { convertMatchTypes } from "@/lib/algorithms/matchType";

describe("convertMatchTypes", () => {
  it("formats each selected match type with the correct wrapper syntax", () => {
    const { results, validCount } = convertMatchTypes(
      ["running shoes"],
      ["broad", "phrase", "exact", "bmm"],
    );

    expect(validCount).toBe(1);
    expect(results.broad).toEqual(["running shoes"]);
    expect(results.phrase).toEqual(['"running shoes"']);
    expect(results.exact).toEqual(["[running shoes]"]);
    expect(results.bmm).toEqual(["+running +shoes"]);
  });

  it("treats blank/whitespace-only input as an empty result, not an error", () => {
    const { results, flagged, validCount } = convertMatchTypes(
      ["", "   ", "\t"],
      ["broad"],
    );

    expect(results.broad).toEqual([]);
    expect(flagged).toEqual([]);
    expect(validCount).toBe(0);
  });

  it("ignores blank lines without counting them", () => {
    const { validCount } = convertMatchTypes(
      ["running shoes", "", "hiking boots"],
      ["broad"],
    );
    expect(validCount).toBe(2);
  });

  it("strips an existing phrase wrapper before reapplying exact match", () => {
    const { results } = convertMatchTypes(['"running shoes"'], ["exact"]);
    expect(results.exact).toEqual(["[running shoes]"]);
  });

  it("strips an existing exact wrapper before reapplying phrase match", () => {
    const { results } = convertMatchTypes(["[running shoes]"], ["phrase"]);
    expect(results.phrase).toEqual(['"running shoes"']);
  });

  it("strips an existing BMM wrapper before reapplying broad match", () => {
    const { results } = convertMatchTypes(["+running +shoes"], ["broad"]);
    expect(results.broad).toEqual(["running shoes"]);
  });

  it("does not strip a leading + when only some tokens have one", () => {
    const { results } = convertMatchTypes(["+1 running shoes"], ["broad"]);
    expect(results.broad).toEqual(["+1 running shoes"]);
  });

  it("collapses case-insensitive duplicates, keeping the first occurrence's casing", () => {
    const { results, validCount } = convertMatchTypes(
      ["Running Shoes", "running shoes", "RUNNING SHOES"],
      ["broad"],
      { removeDuplicates: true },
    );

    expect(validCount).toBe(1);
    expect(results.broad).toEqual(["Running Shoes"]);
  });

  it("lowercases before deduping when both options are on", () => {
    const { results, validCount } = convertMatchTypes(
      ["Running Shoes", "running shoes"],
      ["broad"],
      { removeDuplicates: true, lowercase: true },
    );

    expect(validCount).toBe(1);
    expect(results.broad).toEqual(["running shoes"]);
  });

  it("keeps case-insensitive duplicates as separate lines when dedupe is off", () => {
    const { validCount } = convertMatchTypes(
      ["Running Shoes", "running shoes"],
      ["broad"],
      { removeDuplicates: false },
    );
    expect(validCount).toBe(2);
  });

  it("flags lines over 80 characters instead of dropping them", () => {
    const longKeyword = "a".repeat(81);
    const { results, flagged, validCount } = convertMatchTypes(
      [longKeyword, "running shoes"],
      ["broad"],
    );

    expect(validCount).toBe(1);
    expect(results.broad).toEqual(["running shoes"]);
    expect(flagged).toEqual([longKeyword]);
  });

  it("strips disallowed characters but keeps letters, numbers, spaces, - ' &", () => {
    const { results } = convertMatchTypes(
      ["Men's running-shoes & boots! #2024"],
      ["broad"],
      { stripSpecialChars: true },
    );
    expect(results.broad).toEqual(["Men's running-shoes & boots 2024"]);
  });

  it("collapses extra whitespace when trimExtraWhitespace is on", () => {
    const { results } = convertMatchTypes(
      ["running    shoes   sale"],
      ["broad"],
      { trimExtraWhitespace: true },
    );
    expect(results.broad).toEqual(["running shoes sale"]);
  });

  it("sorts the output alphabetically, applied consistently across match types", () => {
    const { results } = convertMatchTypes(
      ["zebra shoes", "apple shoes"],
      ["broad", "exact"],
      { sortAlphabetically: true },
    );
    expect(results.broad).toEqual(["apple shoes", "zebra shoes"]);
    expect(results.exact).toEqual(["[apple shoes]", "[zebra shoes]"]);
  });

  it("only returns results for the selected match types", () => {
    const { results } = convertMatchTypes(["running shoes"], ["exact"]);
    expect(results).toEqual({ exact: ["[running shoes]"] });
  });
});
