import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { Textarea } from "@/components/shared/Textarea";

function ControlledTextarea() {
  const [value, setValue] = useState("");
  return (
    <Textarea id="kw" label="Keywords" value={value} onChange={setValue} />
  );
}

describe("Textarea", () => {
  it("associates the label and forwards typed input", async () => {
    render(<ControlledTextarea />);
    const field = screen.getByLabelText("Keywords");

    await userEvent.type(field, "running shoes");
    expect(field).toHaveValue("running shoes");
  });

  it("counts non-blank lines only, ignoring whitespace-only lines", async () => {
    render(<ControlledTextarea />);
    const field = screen.getByLabelText("Keywords");

    await userEvent.click(field);
    await userEvent.paste("running shoes\n   \nhiking boots");
    expect(screen.getByText("2 keywords")).toBeInTheDocument();
  });

  it("renders an error message with role=alert and marks the field invalid", () => {
    render(
      <Textarea
        id="kw"
        label="Keywords"
        value="over the limit"
        onChange={() => {}}
        error
        errorMessage="Max 5,000 lines - you have 5,412."
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(/5,412/);
    expect(screen.getByLabelText("Keywords")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });
});
