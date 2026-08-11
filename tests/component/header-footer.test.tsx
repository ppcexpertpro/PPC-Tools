import { render, screen } from "@testing-library/react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

jest.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("Header", () => {
  it("links the wordmark back to the suite home", () => {
    render(<Header />);
    expect(screen.getByRole("link", { name: /ppc tools/i })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("renders the tool switcher nav", () => {
    render(<Header />);
    expect(
      screen.getByRole("navigation", { name: "Tools" }),
    ).toBeInTheDocument();
  });
});

describe("Footer", () => {
  it("links to all three tools and states the privacy promise", () => {
    render(<Footer />);
    expect(
      screen.getByRole("link", { name: "Keyword Match Type" }),
    ).toHaveAttribute("href", "/keyword-match-type");
    expect(
      screen.getByRole("link", { name: "Keyword Merge & Match" }),
    ).toHaveAttribute("href", "/keyword-merge-match");
    expect(
      screen.getByRole("link", { name: "Negative Keyword Finder" }),
    ).toHaveAttribute("href", "/negative-keyword-finder");
    expect(
      screen.getByText(/nothing is ever sent to a server/i),
    ).toBeInTheDocument();
  });
});
