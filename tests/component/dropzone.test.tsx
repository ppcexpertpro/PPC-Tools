import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dropzone } from "@/components/shared/Dropzone";

describe("Dropzone", () => {
  it("calls onFileSelected when a file is chosen via the file input", async () => {
    const onFileSelected = jest.fn();
    render(<Dropzone accept=".csv" onFileSelected={onFileSelected} />);

    const file = new File(["a,b"], "report.csv", { type: "text/csv" });
    const input = screen.getByLabelText(/upload a search-terms file/i);
    await userEvent.upload(input, file);

    expect(onFileSelected).toHaveBeenCalledWith(file);
  });

  it("shows the status message while uploading", () => {
    render(
      <Dropzone
        accept=".csv"
        onFileSelected={jest.fn()}
        status="uploading"
        statusText="Counting words…"
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Counting words…");
  });

  it("shows an error message with role=alert", () => {
    render(
      <Dropzone
        accept=".csv"
        onFileSelected={jest.fn()}
        status="error"
        errorMessage="We couldn't read this file."
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "We couldn't read this file.",
    );
  });

  it("accepts a file dropped anywhere on the page", () => {
    const onFileSelected = jest.fn();
    render(<Dropzone accept=".csv" onFileSelected={onFileSelected} />);

    const file = new File(["a,b"], "report.csv", { type: "text/csv" });
    const dropEvent = new Event("drop", {
      bubbles: true,
      cancelable: true,
    }) as DragEvent;
    Object.defineProperty(dropEvent, "dataTransfer", {
      value: { types: ["Files"], files: [file] },
    });
    fireEvent(window, dropEvent);

    expect(onFileSelected).toHaveBeenCalledWith(file);
  });
});
