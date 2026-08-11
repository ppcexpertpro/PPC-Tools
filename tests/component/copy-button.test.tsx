import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CopyButton } from "@/components/shared/CopyButton";
import { useUIStore } from "@/store/uiStore";

describe("CopyButton", () => {
  afterEach(() => {
    useUIStore.setState({ toasts: [] });
  });

  it("copies via the Clipboard API and shows the Copied! confirmation", async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    render(<CopyButton text="running shoes" />);
    await userEvent.click(screen.getByRole("button", { name: "Copy" }));

    expect(writeText).toHaveBeenCalledWith("running shoes");
    expect(
      await screen.findByRole("button", { name: /copied!/i }),
    ).toBeInTheDocument();
    expect(useUIStore.getState().toasts[0]?.message).toMatch(/copied/i);
  });

  it("falls back to a manual-copy textarea when both copy methods fail", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      configurable: true,
    });
    document.execCommand = jest.fn().mockReturnValue(false);

    render(<CopyButton text="running shoes" />);
    await userEvent.click(screen.getByRole("button", { name: "Copy" }));

    await waitFor(() => {
      expect(
        screen.getByLabelText(/select this text and copy manually/i),
      ).toHaveValue("running shoes");
    });
    expect(useUIStore.getState().toasts[0]?.variant).toBe("error");
  });
});
