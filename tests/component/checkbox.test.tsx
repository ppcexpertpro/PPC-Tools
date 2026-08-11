import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Checkbox } from "@/components/shared/Checkbox";

describe("Checkbox", () => {
  it("reports the new checked state on toggle", async () => {
    const onChange = jest.fn();
    render(
      <Checkbox
        id="dedupe"
        label="Remove duplicate lines"
        checked={false}
        onChange={onChange}
      />,
    );

    await userEvent.click(
      screen.getByRole("checkbox", { name: /remove duplicate lines/i }),
    );
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("renders an optional description", () => {
    render(
      <Checkbox
        id="strip"
        label="Strip special characters"
        description="Keeps letters, numbers, spaces, - ' &"
        checked={false}
        onChange={jest.fn()}
      />,
    );
    expect(
      screen.getByText("Keeps letters, numbers, spaces, - ' &"),
    ).toBeInTheDocument();
  });
});
