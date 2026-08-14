import { renderHook, act } from "@testing-library/react";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

describe("useDebouncedValue", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("holds the initial value until the delay elapses", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 150),
      { initialProps: { value: "a" } },
    );

    expect(result.current).toBe("a");
    rerender({ value: "b" });
    expect(result.current).toBe("a");

    act(() => {
      jest.advanceTimersByTime(149);
    });
    expect(result.current).toBe("a");

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe("b");
  });

  it("resets the timer on rapid successive changes", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 150),
      { initialProps: { value: "a" } },
    );

    rerender({ value: "b" });
    act(() => {
      jest.advanceTimersByTime(100);
    });
    rerender({ value: "c" });
    act(() => {
      jest.advanceTimersByTime(100);
    });
    // Only 100ms since the last change ("c") - should not have committed yet.
    expect(result.current).toBe("a");

    act(() => {
      jest.advanceTimersByTime(50);
    });
    expect(result.current).toBe("c");
  });
});
