import { render, screen } from "@testing-library/react";
import { Counter } from "@/components/shared/Counter";

describe("Counter", () => {
  it("renders neutral text without an alert role", () => {
    render(<Counter>128 keywords</Counter>);
    expect(screen.getByText("128 keywords")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("announces the error state via role=alert", () => {
    render(
      <Counter state="error">
        Reduce group sizes - currently would generate 34,500 keywords, max is
        20,000
      </Counter>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(/34,500/);
  });
});
