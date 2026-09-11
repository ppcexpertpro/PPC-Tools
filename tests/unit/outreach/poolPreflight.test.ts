import { runPoolPreflight } from "@/lib/outreach/preflight/pool";
import type { TxtResolver } from "@/lib/outreach/preflight/dns";

function fakeResolver(passingDomains: string[]): TxtResolver {
  return async (hostname: string) => {
    const domain = hostname.replace(/^_dmarc\.|^default\._domainkey\./, "");
    if (!passingDomains.includes(domain)) return [];
    if (hostname.startsWith("_dmarc.")) return [["v=DMARC1; p=reject"]];
    if (hostname.startsWith("default._domainkey.")) return [["v=DKIM1; k=rsa; p=abc"]];
    return [["v=spf1 include:_spf.example.com ~all"]];
  };
}

const BASE_INPUT = {
  postalAddress: "123 Main St",
  templates: ["Hi {{first_name}}"],
  contacts: [{ id: "c1", email: "a@example.com", fields: { first_name: "Alex" } }],
  dkimSelector: "default",
};

describe("runPoolPreflight", () => {
  it("passes when every distinct pool domain passes its own checks", async () => {
    const result = await runPoolPreflight(
      { ...BASE_INPUT, senderDomains: ["acme.com", "beta.com"] },
      fakeResolver(["acme.com", "beta.com"]),
    );

    expect(result.pass).toBe(true);
    expect(result.perDomain).toHaveLength(2);
    expect(result.perDomain.every((d) => d.result.pass)).toBe(true);
  });

  it("fails overall when any one distinct pool domain fails, even if others pass", async () => {
    const result = await runPoolPreflight(
      { ...BASE_INPUT, senderDomains: ["acme.com", "bad.com"] },
      fakeResolver(["acme.com"]),
    );

    expect(result.pass).toBe(false);
    const bad = result.perDomain.find((d) => d.domain === "bad.com");
    expect(bad?.result.pass).toBe(false);
    const good = result.perDomain.find((d) => d.domain === "acme.com");
    expect(good?.result.pass).toBe(true);
  });

  it("checks only one domain once even if it appears once in senderDomains (caller dedupes)", async () => {
    const result = await runPoolPreflight({ ...BASE_INPUT, senderDomains: ["acme.com"] }, fakeResolver(["acme.com"]));
    expect(result.perDomain).toHaveLength(1);
  });
});
