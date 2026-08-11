import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MergeMatchApp } from "@/app/keyword-merge-match/MergeMatchApp";
import { mergeGroups } from "@/lib/algorithms/merge";
import { convertMatchTypes } from "@/lib/algorithms/matchType";
import type { MergeWorkerRequest } from "@/lib/workers/merge.worker";

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

  postMessage(data: MergeWorkerRequest) {
    queueMicrotask(() => {
      const mergeResult = mergeGroups(data.groups, data.mergeOptions);
      const response =
        mergeResult.status !== "ok"
          ? mergeResult
          : {
              status: "ok" as const,
              ...convertMatchTypes(
                mergeResult.combinations,
                data.matchTypes,
                {},
              ),
            };
      this.messageListeners.forEach((listener) =>
        listener({ data: response } as MessageEvent),
      );
    });
  }

  terminate() {}
}

// jest.mock() doesn't resolve the "@/" alias in this Jest/Next setup.
jest.mock("../../lib/workers/mergeWorkerClient", () => ({
  createMergeWorker: () => new MockWorker(),
}));

describe("MergeMatchApp", () => {
  it("shows guidance instead of an error when fewer than two groups have content", async () => {
    render(<MergeMatchApp />);
    await userEvent.type(screen.getByLabelText("Group 1 terms"), "best");

    expect(
      screen.getByText(/add at least one more group to merge/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Merge & Process" }),
    ).toBeDisabled();
  });

  it("golden path: merges two groups in on-screen order and formats the result", async () => {
    render(<MergeMatchApp />);

    await userEvent.type(
      screen.getByLabelText("Group 1 terms"),
      "best{enter}cheap",
    );
    await userEvent.type(
      screen.getByLabelText("Group 2 terms"),
      "running shoes",
    );

    expect(
      await screen.findByText(/will generate 2 keywords/i),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Merge & Process" }),
    );

    const broadBlock = await screen.findByTestId("output-block-broad");
    expect(
      within(broadBlock).getByText("best running shoes"),
    ).toBeInTheDocument();
    expect(
      within(broadBlock).getByText("cheap running shoes"),
    ).toBeInTheDocument();
  });

  it("blocks processing above the 20,000-combination cap", async () => {
    render(<MergeMatchApp />);

    const bigList = Array.from({ length: 200 }, (_, i) => `a${i}`).join("\n");
    const groupOne = screen.getByLabelText("Group 1 terms");
    const groupTwo = screen.getByLabelText("Group 2 terms");

    await userEvent.click(groupOne);
    await userEvent.paste(bigList);
    await userEvent.click(groupTwo);
    await userEvent.paste(bigList);

    expect(
      await screen.findByText(/reduce group sizes.*40,000/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Merge & Process" }),
    ).toBeDisabled();
  });

  it("reorders groups via the mobile up/down buttons, changing merge order", async () => {
    render(<MergeMatchApp />);

    await userEvent.type(screen.getByLabelText("Group 1 terms"), "best");
    await userEvent.type(
      screen.getByLabelText("Group 2 terms"),
      "running shoes",
    );

    await userEvent.click(
      screen.getByRole("button", { name: /move group 2 up/i }),
    );

    const labelInputs = screen.getAllByRole("textbox", { name: "Group name" });
    expect(
      labelInputs.map((input) => (input as HTMLInputElement).value),
    ).toEqual(["Group 2", "Group 1"]);

    await screen.findByText(/will generate 1 keyword/i);
    await userEvent.click(
      screen.getByRole("button", { name: "Merge & Process" }),
    );

    const broadBlock = await screen.findByTestId("output-block-broad");
    // Group 2 ("running shoes") now merges first: "running shoes best".
    expect(
      within(broadBlock).getByText("running shoes best"),
    ).toBeInTheDocument();
  });
});
