import crypto from "node:crypto";

export interface BasicCredentials {
  user: string;
  pass: string;
}

export function parseBasicAuthHeader(header: string | null): BasicCredentials | null {
  if (!header?.startsWith("Basic ")) return null;
  const decoded = Buffer.from(header.slice("Basic ".length), "base64").toString("utf8");
  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex === -1) return { user: decoded, pass: "" };
  return { user: decoded.slice(0, separatorIndex), pass: decoded.slice(separatorIndex + 1) };
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function isAuthorized(
  credentials: BasicCredentials | null,
  expectedUser: string,
  expectedPass: string,
): boolean {
  if (!credentials) return false;
  return timingSafeEqual(credentials.user, expectedUser) && timingSafeEqual(credentials.pass, expectedPass);
}
