import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MatchTypeApp } from "@/app/keyword-match-type/MatchTypeApp";
import { convertMatchTypes } from "@/lib/algorithms/matchType";
import type { MatchTypeWorkerRequest } from "@/lib/workers/matchType.worker";

type Listener = (event: MessageEvent) => void;

class MockWorker {
  private messageListeners: Listener[] = [];

  addEventListener(type: string, listener: Listener) {
    if (type === "message") this.messageListeners.push(listener);
  }

  removeEventListener(type: string, listener: Listener) {
    if (type === "message") {
      this.messageListeners = this.messageListeners.filter(
        (registered) => registered !== listener,
      );
    }
  }

  postMessage(data: MatchTypeWorkerRequest) {
    queueMicrotask(() => {
      const result = convertMatchTypes(
        data.lines,
        data.selectedTypes,
        data.options,
      );
      this.messageListeners.forEach((listener) =>
        listener({ data: result } as MessageEvent),
      );
    });
  }

  terminate() {}
}

// jest.mock() does not resolve the "@/" alias in this Jest/Next setup
// (unlike regular imports) — use a relative path here specifically.
jest.mock("../../lib/workers/matchTypeWorkerClient", () => ({
  createMatchTypeWorker: () => new MockWorker(),
}));

describe("MatchTypeApp", () => {
  it("golden path: formats input into the selected match types with correct counts", async () => {
    render(<MatchTypeApp />);

    await userEvent.type(
      screen.getByLabelText("Keywords"),
      "running shoes{enter}Running Shoes{enter}hiking boots",
    );
    // Default match types = ["broad"]; add Phrase for this test.
    await userEvent.click(screen.getByRole("checkbox", { name: /^phrase/i }));
    await userEvent.click(screen.getByRole("button", { name: "Process" }));

    const broadBlock = (await screen.findByText(/^Broad \(2\)$/)).closest(
      "div",
    )!.parentElement!;
    expect(within(broadBlock).getByText("running shoes")).toBeInTheDocument();

    const phraseBlock = screen
      .getByText(/^Phrase \(2\)$/)
      .closest("div")!.parentElement!;
    expect(
      within(phraseBlock).getByText('"running shoes"'),
    ).toBeInTheDocument();
  });

  it("shows the flagged list for keywords over 80 characters without dropping them", async () => {
    render(<MatchTypeApp />);
    const longKeyword = "a".repeat(90);

    await userEvent.type(screen.getByLabelText("Keywords"), longKeyword);
    await userEvent.click(screen.getByRole("button", { name: "Process" }));

    expect(await screen.findByText(/needs review \(1\)/i)).toBeInTheDocument();
  });

  it("blocks processing above the 5,000-line hard cap with an inline error", async () => {
    render(<MatchTypeApp />);
    const tooMany = Array.from({ length: 5001 }, (_, i) => `kw ${i}`).join(
      "\n",
    );

    const field = screen.getByLabelText("Keywords");
    await userEvent.click(field);
    await userEvent.paste(tooMany);

    expect(
      await screen.findByText(/max 5,000 lines — you have 5,001/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Process" })).toBeDisabled();
  });

  it("requires at least one match type before processing", async () => {
    render(<MatchTypeApp />);
    await userEvent.type(screen.getByLabelText("Keywords"), "running shoes");

    // Uncheck the default "Broad" selection.
    const broadCheckbox = document.querySelector(
      "#match-type-broad",
    ) as HTMLInputElement;
    await userEvent.click(broadCheckbox);

    expect(
      screen.getByText(/select at least one match type/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Process" })).toBeDisabled();
  });
});
