import { render, screen } from "@testing-library/react";
import { SkeletonBlock } from "@/components/shared/SkeletonBlock";

describe("SkeletonBlock", () => {
  it("exposes a status role for assistive tech", () => {
    render(<SkeletonBlock />);
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });

  it("renders the requested number of skeleton lines", () => {
    const { container } = render(<SkeletonBlock lines={3} />);
    expect(
      container.querySelectorAll('[role="status"] > div:last-child > div'),
    ).toHaveLength(3);
  });
});
