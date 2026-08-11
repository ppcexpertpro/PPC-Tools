import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MatchTypeSelector } from "@/components/shared/MatchTypeSelector";

describe("MatchTypeSelector", () => {
  it("multi-select mode adds and removes types from the selected array", async () => {
    const onChange = jest.fn();
    const { container } = render(
      <MatchTypeSelector
        mode="multi"
        selected={["broad"]}
        onChange={onChange}
      />,
    );

    await userEvent.click(container.querySelector("#match-type-phrase")!);
    expect(onChange).toHaveBeenLastCalledWith(["broad", "phrase"]);

    await userEvent.click(container.querySelector("#match-type-broad")!);
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("single-select mode reports the newly chosen type only", async () => {
    const onChange = jest.fn();
    const { container } = render(
      <MatchTypeSelector
        mode="single"
        types={["broad", "phrase", "exact"]}
        selected="broad"
        onChange={onChange}
      />,
    );

    await userEvent.click(container.querySelector("#match-type-exact")!);
    expect(onChange).toHaveBeenCalledWith("exact");
  });

  it("labels BMM as legacy per PRD §5.1", () => {
    render(
      <MatchTypeSelector mode="multi" selected={[]} onChange={jest.fn()} />,
    );
    expect(
      screen.getByText(/broad match modifier \(legacy\)/i),
    ).toBeInTheDocument();
  });
});
