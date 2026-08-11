import { render, screen } from "@testing-library/react";
import { ToolSwitcher } from "@/components/layout/ToolSwitcher";

jest.mock("next/navigation", () => ({
  usePathname: () => "/keyword-merge-match",
}));

describe("ToolSwitcher", () => {
  it("marks the current route's link as the active page", () => {
    render(<ToolSwitcher />);

    expect(screen.getByRole("link", { name: "Merge & Match" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("link", { name: "Match Type" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("links to all three tool routes", () => {
    render(<ToolSwitcher />);
    expect(screen.getAllByRole("link")).toHaveLength(3);
  });
});
