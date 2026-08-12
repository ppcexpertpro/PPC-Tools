import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Chip } from "@/components/shared/Chip";

describe("Chip", () => {
  it("renders the label and calls onRemove when the × is clicked", async () => {
    const onRemove = jest.fn();
    render(<Chip label="running" onRemove={onRemove} />);

    expect(screen.getByText("running")).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: /remove running/i }),
    );
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
