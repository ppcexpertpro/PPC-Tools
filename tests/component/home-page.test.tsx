import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";

describe("HomePage", () => {
  it("renders the suite heading", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("heading", { name: /paste a list/i, level: 1 }),
    ).toBeInTheDocument();
  });

  it("renders a card linking to each of the three tools", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("link", { name: /keyword match type/i }),
    ).toHaveAttribute("href", "/keyword-match-type");
    expect(
      screen.getByRole("link", { name: /keyword merge & match/i }),
    ).toHaveAttribute("href", "/keyword-merge-match");
    expect(
      screen.getByRole("link", { name: /negative keyword finder/i }),
    ).toHaveAttribute("href", "/negative-keyword-finder");
  });
});
