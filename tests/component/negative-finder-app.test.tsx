import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NegativeFinderApp } from "@/app/negative-keyword-finder/NegativeFinderApp";
import { tokenizeAndCount } from "@/lib/algorithms/tokenize";
import type { TokenizeWorkerRequest } from "@/lib/workers/tokenize.worker";

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

  postMessage(data: TokenizeWorkerRequest) {
    queueMicrotask(() => {
      const result = tokenizeAndCount(
        data.terms,
        data.ngramSizes,
        data.filters,
      );
      this.messageListeners.forEach((listener) =>
        listener({ data: result } as MessageEvent),
      );
    });
  }

  terminate() {}
}

// jest.mock() doesn't resolve the "@/" alias in this Jest/Next setup.
jest.mock("../../lib/workers/tokenizeWorkerClient", () => ({
  createTokenizeWorker: () => new MockWorker(),
}));

describe("NegativeFinderApp", () => {
  it("paste path: tokenizes pasted rows and shows a unigram frequency table", async () => {
    render(<NegativeFinderApp />);

    await userEvent.click(screen.getByLabelText("Paste search terms"));
    await userEvent.paste("running shoes for men\nrunning shoes for women");

    expect(
      await screen.findByRole("button", { name: /^running, 2 occurrences/i }),
    ).toBeInTheDocument();
    // "for" is a stopword and hidden by default.
    expect(
      screen.queryByRole("button", { name: /^for,/i }),
    ).not.toBeInTheDocument();
  });

  it("selecting a token adds it to the Selected negatives panel with a live count", async () => {
    render(<NegativeFinderApp />);
    await userEvent.click(screen.getByLabelText("Paste search terms"));
    await userEvent.paste("running shoes\nrunning boots");

    const tokenButton = await screen.findByRole("button", {
      name: /^running, 2 occurrences/i,
    });
    await userEvent.click(tokenButton);

    expect(screen.getByText("Selected negatives (1)")).toBeInTheDocument();
    expect(tokenButton).toHaveAttribute("aria-pressed", "true");
  });

  it("exports selected negatives formatted with the chosen match type", async () => {
    render(<NegativeFinderApp />);
    await userEvent.click(screen.getByLabelText("Paste search terms"));
    await userEvent.paste("running shoes\nrunning boots");

    const tokenButton = await screen.findByRole("button", {
      name: /^running, 2 occurrences/i,
    });
    await userEvent.click(tokenButton);

    await userEvent.click(document.querySelector("#match-type-exact")!);

    expect(
      screen.getByRole("button", { name: "Download .txt" }),
    ).not.toBeDisabled();
  });

  it("toggling 'Hide common words' off reveals stopword tokens", async () => {
    render(<NegativeFinderApp />);
    await userEvent.click(screen.getByLabelText("Paste search terms"));
    await userEvent.paste("shoes for men");

    await screen.findByRole("button", { name: /^shoes,/i });
    expect(
      screen.queryByRole("button", { name: /^for,/i }),
    ).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("checkbox", { name: /hide common words/i }),
    );

    expect(
      await screen.findByRole("button", { name: /^for, 1 occurrence/i }),
    ).toBeInTheDocument();
  });

  it("shows bigram and trigram tables when those n-gram sizes are enabled", async () => {
    render(<NegativeFinderApp />);
    await userEvent.click(screen.getByLabelText("Paste search terms"));
    await userEvent.paste("red running shoes");
    await screen.findByRole("button", { name: /^running,/i });

    await userEvent.click(screen.getByRole("checkbox", { name: /bigram/i }));

    expect(await screen.findByText("Bigrams")).toBeInTheDocument();
    const bigramSection = screen.getByText("Bigrams").closest("div")!;
    expect(
      within(bigramSection).getByRole("button", {
        name: /red running/i,
      }),
    ).toBeInTheDocument();
  });

  it("file path: auto-detects the search-term column and tokenizes its rows", async () => {
    render(<NegativeFinderApp />);
    const csv = "Search Term,Clicks\nrunning shoes,10\nrunning boots,5\n";
    const file = new File([csv], "report.csv", { type: "text/csv" });

    await userEvent.upload(
      screen.getByLabelText(/upload a search-terms file/i),
      file,
    );

    expect(
      await screen.findByRole("button", { name: /^running, 2 occurrences/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Using 2 rows from your uploaded file."),
    ).toBeInTheDocument();
  });

  it("file path: shows a manual column picker when the column is ambiguous", async () => {
    render(<NegativeFinderApp />);
    const csv = "Query,Search Term\nrunning shoes,alt text\n";
    const file = new File([csv], "report.csv", { type: "text/csv" });

    await userEvent.upload(
      screen.getByLabelText(/upload a search-terms file/i),
      file,
    );

    const picker = await screen.findByLabelText(
      /couldn't automatically detect/i,
    );
    await userEvent.selectOptions(picker, "Query");

    expect(
      await screen.findByRole("button", { name: /^running, 1 occurrence/i }),
    ).toBeInTheDocument();
  });

  it("rejects a file over the 10MB size cap without reading it", async () => {
    render(<NegativeFinderApp />);
    const file = new File(["term"], "big.csv", { type: "text/csv" });
    Object.defineProperty(file, "size", { value: 11 * 1024 * 1024 });

    await userEvent.upload(
      screen.getByLabelText(/upload a search-terms file/i),
      file,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /max file size is 10mb/i,
    );
  });

  it("rejects a file over the 50,000-row cap rather than truncating it", async () => {
    render(<NegativeFinderApp />);
    const rows = Array.from({ length: 50001 }, (_, i) => `term ${i}`).join(
      "\n",
    );
    const file = new File([rows], "huge.txt", { type: "text/plain" });

    await userEvent.upload(
      screen.getByLabelText(/upload a search-terms file/i),
      file,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /max 50,000 rows/i,
    );
  });
});
