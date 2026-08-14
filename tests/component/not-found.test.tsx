import { render, screen } from "@testing-library/react";
import NotFound from "@/app/not-found";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ back: jest.fn() }),
}));

describe("NotFound", () => {
  it("renders a heading and a link back to the home page", () => {
    render(<NotFound />);
    expect(
      screen.getByRole("heading", { name: /page not found/i, level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to tools/i })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("renders a button to go back", () => {
    render(<NotFound />);
    expect(
      screen.getByRole("button", { name: /go back/i }),
    ).toBeInTheDocument();
  });
});
