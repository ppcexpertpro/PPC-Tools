import { runPreflight, type PreflightInput, type PreflightResult } from "./index";
import type { TxtResolver } from "./dns";

export interface PoolPreflightInput extends Omit<PreflightInput, "senderDomain"> {
  /** Distinct sender domains across a campaign's mailbox pool - the
   * caller is responsible for deduping (most pools share one domain). */
  senderDomains: string[];
}

export interface PoolPreflightResult {
  pass: boolean;
  perDomain: { domain: string; result: PreflightResult }[];
}

/**
 * Runs the existing single-domain preflight once per distinct sender
 * domain in a campaign's mailbox pool - a non-compliant pool member can't
 * quietly ride along on another mailbox's clean DNS record.
 */
export async function runPoolPreflight(input: PoolPreflightInput, resolveTxt?: TxtResolver): Promise<PoolPreflightResult> {
  const { senderDomains, ...rest } = input;

  const perDomain = await Promise.all(
    senderDomains.map(async (domain) => ({
      domain,
      result: await runPreflight({ ...rest, senderDomain: domain }, resolveTxt),
    })),
  );

  return { pass: perDomain.every((d) => d.result.pass), perDomain };
}
