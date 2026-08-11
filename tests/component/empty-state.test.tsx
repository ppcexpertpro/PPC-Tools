import { render, screen } from "@testing-library/react";
import { EmptyState } from "@/components/shared/EmptyState";

describe("EmptyState", () => {
  it("renders the title and description", () => {
    render(
      <EmptyState
        title="Your formatted keywords will appear here"
        description="Paste a list and click Process to get started."
      />,
    );

    expect(
      screen.getByText("Your formatted keywords will appear here"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Paste a list and click Process to get started."),
    ).toBeInTheDocument();
  });
});
