import {
  bucketInputSize,
  setAnalyticsReporter,
  trackEvent,
} from "@/lib/analytics";

describe("bucketInputSize", () => {
  it("buckets at the documented boundaries", () => {
    expect(bucketInputSize(1)).toBe("1-100");
    expect(bucketInputSize(100)).toBe("1-100");
    expect(bucketInputSize(101)).toBe("101-1000");
    expect(bucketInputSize(1000)).toBe("101-1000");
    expect(bucketInputSize(1001)).toBe("1000+");
  });
});

describe("trackEvent / setAnalyticsReporter", () => {
  it("forwards events to the currently registered reporter", () => {
    const reporter = jest.fn();
    setAnalyticsReporter(reporter);

    trackEvent({
      name: "value_action",
      tool: "keyword-match-type",
      action: "copy_all",
    });

    expect(reporter).toHaveBeenCalledWith({
      name: "value_action",
      tool: "keyword-match-type",
      action: "copy_all",
    });
  });

  it("swaps reporters cleanly - the old one stops receiving events", () => {
    const first = jest.fn();
    const second = jest.fn();

    setAnalyticsReporter(first);
    setAnalyticsReporter(second);
    trackEvent({
      name: "limit_hit",
      tool: "keyword-merge-match",
      limitType: "merge_cap",
    });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
