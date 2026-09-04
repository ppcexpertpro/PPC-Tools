import { parseBasicAuthHeader, isAuthorized } from "@/lib/outreach/auth/basicAuth";

describe("parseBasicAuthHeader", () => {
  it("parses a valid Basic auth header", () => {
    const header = `Basic ${Buffer.from("alice:secret").toString("base64")}`;
    expect(parseBasicAuthHeader(header)).toEqual({ user: "alice", pass: "secret" });
  });

  it("returns null for a missing header", () => {
    expect(parseBasicAuthHeader(null)).toBeNull();
  });

  it("returns null for a non-Basic header", () => {
    expect(parseBasicAuthHeader("Bearer abc123")).toBeNull();
  });

  it("treats a missing colon as an empty password", () => {
    const header = `Basic ${Buffer.from("aliceonly").toString("base64")}`;
    expect(parseBasicAuthHeader(header)).toEqual({ user: "aliceonly", pass: "" });
  });
});

describe("isAuthorized", () => {
  it("accepts matching credentials", () => {
    expect(isAuthorized({ user: "alice", pass: "secret" }, "alice", "secret")).toBe(true);
  });
  it("rejects a wrong password", () => {
    expect(isAuthorized({ user: "alice", pass: "wrong" }, "alice", "secret")).toBe(false);
  });
  it("rejects a wrong username", () => {
    expect(isAuthorized({ user: "bob", pass: "secret" }, "alice", "secret")).toBe(false);
  });
  it("rejects when no credentials were supplied", () => {
    expect(isAuthorized(null, "alice", "secret")).toBe(false);
  });
});
