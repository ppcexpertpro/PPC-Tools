import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FrequencyTable } from "@/components/shared/FrequencyTable";
import type { FrequencyRow } from "@/lib/algorithms/tokenize";

const ROWS: FrequencyRow[] = [
  { token: "shoes", count: 42, pctOfRows: 0.42 },
  { token: "boots", count: 10, pctOfRows: 0.1 },
];

describe("FrequencyTable", () => {
  it("renders a row per token with count and percentage", () => {
    render(
      <FrequencyTable
        rows={ROWS}
        selectedTokens={new Set()}
        onToggleToken={jest.fn()}
        sortColumn="count"
        sortDirection="desc"
        onSortChange={jest.fn()}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: /shoes, 42 occurrences, 42.0% of rows/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /boots, 10 occurrences, 10.0% of rows/i,
      }),
    ).toBeInTheDocument();
  });

  it("toggles a token when its row is clicked", async () => {
    const onToggleToken = jest.fn();
    render(
      <FrequencyTable
        rows={ROWS}
        selectedTokens={new Set()}
        onToggleToken={onToggleToken}
        sortColumn="count"
        sortDirection="desc"
        onSortChange={jest.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /shoes/i }));
    expect(onToggleToken).toHaveBeenCalledWith("shoes");
  });

  it("marks a selected token as pressed", () => {
    render(
      <FrequencyTable
        rows={ROWS}
        selectedTokens={new Set(["shoes"])}
        onToggleToken={jest.fn()}
        sortColumn="count"
        sortDirection="desc"
        onSortChange={jest.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /shoes/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("calls onSortChange when a column header is clicked", async () => {
    const onSortChange = jest.fn();
    render(
      <FrequencyTable
        rows={ROWS}
        selectedTokens={new Set()}
        onToggleToken={jest.fn()}
        sortColumn="count"
        sortDirection="desc"
        onSortChange={onSortChange}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /sort by token/i }),
    );
    expect(onSortChange).toHaveBeenCalledWith("token");
  });

  it("shows a fallback message when no rows match the filters", () => {
    render(
      <FrequencyTable
        rows={[]}
        selectedTokens={new Set()}
        onToggleToken={jest.fn()}
        sortColumn="count"
        sortDirection="desc"
        onSortChange={jest.fn()}
      />,
    );
    expect(
      screen.getByText(/no tokens match the current filters/i),
    ).toBeInTheDocument();
  });
});
