import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastViewport } from "@/components/shared/Toast";
import { useUIStore } from "@/store/uiStore";

describe("ToastViewport", () => {
  beforeEach(() => {
    useUIStore.setState({ toasts: [] });
  });

  it("renders a live region that announces pushed toasts", () => {
    render(<ToastViewport />);

    act(() => {
      useUIStore.getState().showToast("success", "Copied to clipboard");
    });

    expect(screen.getByText("Copied to clipboard")).toBeInTheDocument();
  });

  it("dismisses a toast when its close button is clicked", async () => {
    render(<ToastViewport />);
    act(() => {
      useUIStore.getState().showToast("error", "Something went wrong");
    });

    await userEvent.click(
      screen.getByRole("button", { name: /dismiss notification/i }),
    );

    await waitFor(() =>
      expect(
        screen.queryByText("Something went wrong"),
      ).not.toBeInTheDocument(),
    );
  });
});
