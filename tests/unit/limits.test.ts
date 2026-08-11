import { countNonBlankLines, splitLines } from "@/lib/validation/lineCount";
import {
  getLineCountStatus,
  MATCH_TYPE_HARD_CAP_LINES,
  MATCH_TYPE_SOFT_WARNING_LINES,
} from "@/lib/validation/limits";

describe("countNonBlankLines", () => {
  it("ignores blank and whitespace-only lines", () => {
    expect(countNonBlankLines("a\n\n   \nb\n\t\n")).toBe(2);
  });

  it("returns 0 for empty input", () => {
    expect(countNonBlankLines("")).toBe(0);
  });
});

describe("splitLines", () => {
  it("preserves blank lines for the algorithm layer to handle", () => {
    expect(splitLines("a\n\nb")).toEqual(["a", "", "b"]);
  });
});

describe("getLineCountStatus", () => {
  it("is ok at and below the soft warning threshold", () => {
    expect(getLineCountStatus(MATCH_TYPE_SOFT_WARNING_LINES)).toBe("ok");
  });

  it("warns above the soft warning threshold", () => {
    expect(getLineCountStatus(MATCH_TYPE_SOFT_WARNING_LINES + 1)).toBe(
      "warning",
    );
  });

  it("is still just a warning at exactly the hard cap", () => {
    expect(getLineCountStatus(MATCH_TYPE_HARD_CAP_LINES)).toBe("warning");
  });

  it("blocks above the hard cap", () => {
    expect(getLineCountStatus(MATCH_TYPE_HARD_CAP_LINES + 1)).toBe("blocked");
  });
});
