import { convertMatchTypes } from "@/lib/algorithms/matchType";
import { mergeGroups } from "@/lib/algorithms/merge";
import { tokenizeAndCount } from "@/lib/algorithms/tokenize";

/**
 * TRD §12 performance regression check: the core algorithms run against
 * fixed large fixtures (PRD's stated caps) and must complete within a
 * generous time budget. These budgets are set with wide headroom over
 * observed timings so the check catches a genuine order-of-magnitude
 * regression, not environmental noise from a loaded CI/dev machine.
 */
describe("performance regression: core algorithms against fixed fixtures", () => {
  it("convertMatchTypes stays within budget for 10,000 lines / 4 match types", () => {
    const lines = Array.from(
      { length: 10000 },
      (_, i) => `keyword phrase number ${i}`,
    );

    const start = performance.now();
    const result = convertMatchTypes(
      lines,
      ["broad", "phrase", "exact", "bmm"],
      { removeDuplicates: true, sortAlphabetically: true },
    );
    const elapsed = performance.now() - start;

    expect(result.validCount).toBe(10000);
    // Generous budget — this environment has shown 2-3x slowdowns under
    // full-suite CPU contention; the point is catching a real algorithmic
    // regression (e.g. accidental O(n^2)), not chasing micro-variance.
    expect(elapsed).toBeLessThan(5000);
  });

  it("mergeGroups stays within budget for a 20,000-combination fixture", () => {
    const groupA = Array.from({ length: 200 }, (_, i) => `modifier${i}`);
    const groupB = Array.from({ length: 100 }, (_, i) => `core${i}`);

    const start = performance.now();
    const result = mergeGroups(
      [
        { label: "A", lines: groupA },
        { label: "B", lines: groupB },
      ],
      { removeDuplicates: true },
    );
    const elapsed = performance.now() - start;

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.count).toBe(20000);
    }
    expect(elapsed).toBeLessThan(6000);
  });

  it("tokenizeAndCount stays within budget for a 50,000-row fixture", () => {
    const terms = Array.from(
      { length: 50000 },
      (_, i) => `red running shoes size ${i % 12}`,
    );

    const start = performance.now();
    const result = tokenizeAndCount(terms, [1, 2, 3], {
      hideStopwords: true,
      minLength: 3,
      minFrequency: 1,
    });
    const elapsed = performance.now() - start;

    expect(result[1]?.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(10000);
  });
});
