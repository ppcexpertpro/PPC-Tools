import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/shared/Button";

describe("Button", () => {
  it("renders its label and responds to clicks", async () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Process</Button>);

    await userEvent.click(screen.getByRole("button", { name: "Process" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("disables the button and blocks clicks while loading", async () => {
    const onClick = jest.fn();
    render(
      <Button loading onClick={onClick}>
        Process
      </Button>,
    );

    const button = screen.getByRole("button", { name: /process/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");

    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("respects an explicit disabled prop", () => {
    render(<Button disabled>Process</Button>);
    expect(screen.getByRole("button", { name: "Process" })).toBeDisabled();
  });
});
