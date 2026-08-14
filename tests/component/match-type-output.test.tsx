import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MatchTypeOutput } from "@/components/shared/MatchTypeOutput";
import type { MatchTypeResult } from "@/lib/algorithms/matchType";

const RESULT: MatchTypeResult = {
  results: {
    broad: ["running shoes"],
    exact: ["[running shoes]"],
  },
  flagged: ["a".repeat(90)],
  validCount: 1,
};

describe("MatchTypeOutput", () => {
  it("shows the empty state when there is no result yet", () => {
    render(
      <MatchTypeOutput
        result={null}
        matchTypes={["broad"]}
        showLoading={false}
        emptyTitle="Nothing yet"
        emptyDescription="Paste a list to get started."
        tool="keyword-match-type"
      />,
    );
    expect(screen.getByText("Nothing yet")).toBeInTheDocument();
  });

  it("shows skeleton blocks while loading instead of the result", () => {
    render(
      <MatchTypeOutput
        result={RESULT}
        matchTypes={["broad"]}
        showLoading
        emptyTitle="Nothing yet"
        emptyDescription="Paste a list to get started."
        tool="keyword-match-type"
      />,
    );
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
    expect(screen.queryByTestId("output-block-broad")).not.toBeInTheDocument();
  });

  it("renders one block per selected match type and the flagged list", () => {
    render(
      <MatchTypeOutput
        result={RESULT}
        matchTypes={["broad", "exact"]}
        showLoading={false}
        emptyTitle="Nothing yet"
        emptyDescription="Paste a list to get started."
        tool="keyword-match-type"
      />,
    );

    expect(screen.getByTestId("output-block-broad")).toBeInTheDocument();
    expect(screen.getByTestId("output-block-exact")).toBeInTheDocument();
    expect(screen.getByText(/needs review \(1\)/i)).toBeInTheDocument();
  });

  it("shows a distinct message for a match type that hasn't been processed yet, not a false empty result", () => {
    render(
      <MatchTypeOutput
        result={RESULT}
        matchTypes={["broad", "phrase"]}
        showLoading={false}
        emptyTitle="Nothing yet"
        emptyDescription="Paste a list to get started."
        tool="keyword-match-type"
      />,
    );

    const phraseBlock = screen.getByTestId("output-block-phrase");
    expect(
      within(phraseBlock).getByText(/not processed yet/i),
    ).toBeInTheDocument();
    expect(
      within(phraseBlock).queryByText("No keywords here."),
    ).not.toBeInTheDocument();
  });

  it("shows a stale banner when settings have changed since the result was generated", () => {
    render(
      <MatchTypeOutput
        result={RESULT}
        matchTypes={["broad"]}
        showLoading={false}
        isStale
        emptyTitle="Nothing yet"
        emptyDescription="Paste a list to get started."
        tool="keyword-match-type"
      />,
    );

    const banner = screen.getByText(/before your last change/i);
    expect(banner.closest('[role="status"]')).not.toBeNull();
    expect(screen.getByText(/click Process now/i)).toBeInTheDocument();
  });

  it("does not tell the user to click Process when Process is currently disabled", () => {
    render(
      <MatchTypeOutput
        result={RESULT}
        matchTypes={["broad", "phrase"]}
        showLoading={false}
        isStale
        canProcess={false}
        emptyTitle="Nothing yet"
        emptyDescription="Paste a list to get started."
        tool="keyword-match-type"
      />,
    );

    expect(screen.getByText(/before your last change/i)).toBeInTheDocument();
    expect(screen.queryByText(/click Process now/i)).not.toBeInTheDocument();

    const phraseBlock = screen.getByTestId("output-block-phrase");
    expect(
      within(phraseBlock).getByText(/^Not processed yet\.$/),
    ).toBeInTheDocument();
  });

  it("toggles Copy All between labeled and raw output", async () => {
    render(
      <MatchTypeOutput
        result={RESULT}
        matchTypes={["broad"]}
        showLoading={false}
        emptyTitle="Nothing yet"
        emptyDescription="Paste a list to get started."
        tool="keyword-match-type"
      />,
    );

    const labelToggle = screen.getByRole("checkbox", {
      name: /include labels in copy all/i,
    });
    expect(labelToggle).toBeChecked();

    await userEvent.click(labelToggle);
    expect(labelToggle).not.toBeChecked();
  });
});
