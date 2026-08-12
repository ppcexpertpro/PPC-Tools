import { render, screen } from "@testing-library/react";
import { CrossToolPrompt } from "@/components/shared/CrossToolPrompt";

describe("CrossToolPrompt", () => {
  it("renders the message and a link to the suggested tool", () => {
    render(
      <CrossToolPrompt
        message="Once these are live, mine your search terms report for negatives"
        href="/negative-keyword-finder"
        linkText="Negative Keyword Finder →"
      />,
    );

    expect(
      screen.getByText(/mine your search terms report/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /negative keyword finder/i }),
    ).toHaveAttribute("href", "/negative-keyword-finder");
  });
});
