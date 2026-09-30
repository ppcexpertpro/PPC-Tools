import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NegativeFinderApp } from "@/app/negative-keyword-finder/NegativeFinderApp";
import { tokenizeAndCount } from "@/lib/algorithms/tokenize";
import type { TokenizeWorkerRequest } from "@/lib/workers/tokenize.worker";
import { useUIStore } from "@/store/uiStore";
import * as XLSX from "xlsx";

type Listener = (event: MessageEvent) => void;

/** A workbook shaped like the client's negative-keyword master file. */
function negativeListWorkbook(): File {
  const workbook = XLSX.utils.book_new();
  const sheets: Array<[string, unknown[][]]> = [
    [
      "Essential",
      [
        ["General", null, "Adult"],
        ["club", null, "xxx"],
        ["free", null, "nude"],
      ],
    ],
    ["Doctor - Urgent Care", []],
    ["Fencing", [["Negative Keywords"], ["sword"], ["no charge"], [2018]]],
  ];
  for (const [name, rows] of sheets) {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), name);
  }
  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  return new File([buffer], "negative lists.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

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

async function showFrequencyView() {
  await userEvent.click(screen.getByRole("tab", { name: "Word frequency" }));
}

describe("NegativeFinderApp - keyword list (default view)", () => {
  beforeEach(() => {
    useUIStore.setState({ toasts: [] });
  });

  async function pasteKeywords(text: string) {
    await userEvent.click(screen.getByLabelText("Paste search terms"));
    await userEvent.paste(text);
  }

  it("lists every keyword with its words underneath, and counts them", async () => {
    render(<NegativeFinderApp />);
    await pasteKeywords("no charge\nno cost\ngames");

    expect(
      await screen.findByRole("heading", { name: "Keywords: Found 3" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "no charge" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "charge" })).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox", { name: "no" })).toHaveLength(2);
    expect(screen.getByRole("checkbox", { name: "games" })).toBeInTheDocument();
  });

  it("ticking a keyword or word adds it to the negatives panel", async () => {
    render(<NegativeFinderApp />);
    await pasteKeywords("no charge\nno cost");

    await userEvent.click(
      await screen.findByRole("checkbox", { name: "no charge" }),
    );
    await userEvent.click(screen.getByRole("checkbox", { name: "charge" }));

    expect(
      screen.getByRole("heading", { name: "Negative keywords: Selected 2" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove no charge" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove charge" })).toBeInTheDocument();
  });

  it("a word shared by several keywords is one negative, ticked everywhere", async () => {
    render(<NegativeFinderApp />);
    await pasteKeywords("no charge\nno cost");

    const [firstNo, secondNo] = await screen.findAllByRole("checkbox", {
      name: "no",
    });
    await userEvent.click(firstNo);

    expect(firstNo).toBeChecked();
    expect(secondNo).toBeChecked();
    expect(
      screen.getByRole("heading", { name: "Negative keywords: Selected 1" }),
    ).toBeInTheDocument();
  });

  it("Select all ticks every keyword and word once; Remove all clears them", async () => {
    render(<NegativeFinderApp />);
    await pasteKeywords("no charge\nno cost\ngames");
    await screen.findByRole("heading", { name: "Keywords: Found 3" });

    await userEvent.click(screen.getByRole("button", { name: "Select all" }));
    // no charge, no, charge, no cost, cost, games
    expect(
      screen.getByRole("heading", { name: "Negative keywords: Selected 6" }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Remove all" }));
    expect(
      screen.getByRole("heading", { name: "Negative keywords: Selected 0" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "games" })).not.toBeChecked();
  });

  it("removing a negative from the right panel unticks it on the left", async () => {
    render(<NegativeFinderApp />);
    await pasteKeywords("youtube\nvimeo");

    const youtube = await screen.findByRole("checkbox", { name: "youtube" });
    await userEvent.click(youtube);
    await userEvent.click(screen.getByRole("button", { name: "Remove youtube" }));

    expect(youtube).not.toBeChecked();
    expect(
      screen.getByRole("heading", { name: "Negative keywords: Selected 0" }),
    ).toBeInTheDocument();
  });

  it("a selection made in the list survives switching to word frequency", async () => {
    render(<NegativeFinderApp />);
    await pasteKeywords("running shoes\nrunning boots");

    const [running] = await screen.findAllByRole("checkbox", {
      name: "running",
    });
    await userEvent.click(running);
    await showFrequencyView();

    expect(
      await screen.findByRole("button", { name: /^running, 2 occurrences/i }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});

describe("NegativeFinderApp - multi-sheet workbooks", () => {
  beforeEach(() => {
    useUIStore.setState({ toasts: [] });
  });

  async function uploadWorkbook() {
    render(<NegativeFinderApp />);
    await userEvent.upload(
      screen.getByLabelText(/upload a search-terms file/i),
      negativeListWorkbook(),
    );
  }

  it("offers 'All columns' for a sheet of side-by-side keyword lists", async () => {
    await uploadWorkbook();

    const picker = await screen.findByLabelText(/couldn't automatically detect/i);
    await userEvent.selectOptions(picker, "All columns");

    expect(
      await screen.findByRole("heading", { name: "Keywords: Found 4" }),
    ).toBeInTheDocument();
    for (const keyword of ["club", "free", "xxx", "nude"]) {
      expect(screen.getByRole("checkbox", { name: keyword })).toBeInTheDocument();
    }
  });

  it("switches sheets, auto-detects a 'Negative Keywords' column, and reads numbers", async () => {
    await uploadWorkbook();
    const sheetPicker = await screen.findByLabelText(/sheet \(3 in this workbook\)/i);

    await userEvent.selectOptions(sheetPicker, "Fencing");

    expect(
      await screen.findByRole("heading", { name: "Keywords: Found 3" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "sword" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "2018" })).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/couldn't automatically detect/i),
    ).not.toBeInTheDocument();
  });

  it("keeps ticked negatives when switching sheets, so lists can be combined", async () => {
    await uploadWorkbook();
    await userEvent.selectOptions(
      await screen.findByLabelText(/couldn't automatically detect/i),
      "All columns",
    );
    await userEvent.click(await screen.findByRole("checkbox", { name: "free" }));

    await userEvent.selectOptions(
      screen.getByLabelText(/sheet \(3 in this workbook\)/i),
      "Fencing",
    );
    await userEvent.click(await screen.findByRole("checkbox", { name: "sword" }));

    expect(
      screen.getByRole("heading", { name: "Negative keywords: Selected 2" }),
    ).toBeInTheDocument();
  });

  it("says so when the chosen sheet is empty", async () => {
    await uploadWorkbook();

    await userEvent.selectOptions(
      await screen.findByLabelText(/sheet \(3 in this workbook\)/i),
      "Doctor - Urgent Care",
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /'Doctor - Urgent Care' is empty/i,
    );
  });
});

describe("NegativeFinderApp", () => {
  beforeEach(() => {
    useUIStore.setState({ toasts: [] });
  });

  it("typing into the paste box after a file upload warns before dropping the file", async () => {
    render(<NegativeFinderApp />);
    await showFrequencyView();
    const csv = "Search Term,Clicks\nrunning shoes,10\nrunning boots,5\n";
    const file = new File([csv], "report.csv", { type: "text/csv" });

    await userEvent.upload(
      screen.getByLabelText(/upload a search-terms file/i),
      file,
    );
    expect(
      await screen.findByText("Using 2 rows from your uploaded file."),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText("Paste search terms"));
    await userEvent.paste("something else");

    expect(
      screen.queryByText("Using 2 rows from your uploaded file."),
    ).not.toBeInTheDocument();
    const toast = useUIStore.getState().toasts.at(-1);
    expect(toast?.message).toMatch(/uploaded file is no longer active/i);
  });

  it("paste path: tokenizes pasted rows and shows a unigram frequency table", async () => {
    render(<NegativeFinderApp />);
    await showFrequencyView();

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
    await showFrequencyView();
    await userEvent.click(screen.getByLabelText("Paste search terms"));
    await userEvent.paste("running shoes\nrunning boots");

    const tokenButton = await screen.findByRole("button", {
      name: /^running, 2 occurrences/i,
    });
    await userEvent.click(tokenButton);

    expect(screen.getByRole("heading", { name: "Negative keywords: Selected 1" })).toBeInTheDocument();
    expect(tokenButton).toHaveAttribute("aria-pressed", "true");
  });

  it("'Remove all' empties the selected negatives in one click", async () => {
    render(<NegativeFinderApp />);
    await showFrequencyView();
    await userEvent.click(screen.getByLabelText("Paste search terms"));
    await userEvent.paste("running shoes\nrunning boots");

    await userEvent.click(
      await screen.findByRole("button", { name: /^running, 2 occurrences/i }),
    );
    await userEvent.click(screen.getByRole("button", { name: /^shoes,/i }));
    expect(
      screen.getByRole("heading", { name: "Negative keywords: Selected 2" }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Remove all" }));

    expect(
      screen.getByRole("heading", { name: "Negative keywords: Selected 0" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove all" })).toBeDisabled();
  });

  it("shows punctuation-free, short tokens like 'tv' by default", async () => {
    render(<NegativeFinderApp />);
    await showFrequencyView();
    await userEvent.click(screen.getByLabelText("Paste search terms"));
    await userEvent.paste("running shoes, tv ad");

    expect(
      await screen.findByRole("button", { name: /^shoes, 1 occurrence/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^tv, 1 occurrence/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^shoes,,/i }),
    ).not.toBeInTheDocument();
  });

  it("exports selected negatives formatted with the chosen match type", async () => {
    render(<NegativeFinderApp />);
    await showFrequencyView();
    await userEvent.click(screen.getByLabelText("Paste search terms"));
    await userEvent.paste("running shoes\nrunning boots");

    const tokenButton = await screen.findByRole("button", {
      name: /^running, 2 occurrences/i,
    });
    await userEvent.click(tokenButton);

    await userEvent.click(document.querySelector("#match-type-exact")!);

    expect(
      screen.getByRole("button", { name: "Export" }),
    ).not.toBeDisabled();
  });

  it("toggling 'Hide common words' off reveals stopword tokens", async () => {
    render(<NegativeFinderApp />);
    await showFrequencyView();
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
    await showFrequencyView();
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
    await showFrequencyView();
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
    await showFrequencyView();
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
    await showFrequencyView();
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
    await showFrequencyView();
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
