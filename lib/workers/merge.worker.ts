import {
  mergeGroups,
  type MergeGroup,
  type MergeOptions,
} from "@/lib/algorithms/merge";
import {
  convertMatchTypes,
  type MatchType,
  type MatchTypeResult,
} from "@/lib/algorithms/matchType";

export interface MergeWorkerRequest {
  groups: MergeGroup[];
  mergeOptions: MergeOptions;
  matchTypes: MatchType[];
}

export type MergeWorkerResponse =
  | { status: "needs-more-groups" }
  | { status: "too-many-combinations"; predictedCount: number }
  | ({ status: "ok" } & MatchTypeResult);

self.onmessage = (event: MessageEvent<MergeWorkerRequest>) => {
  const { groups, mergeOptions, matchTypes } = event.data;
  const mergeResult = mergeGroups(groups, mergeOptions);

  if (mergeResult.status !== "ok") {
    self.postMessage(mergeResult satisfies MergeWorkerResponse);
    return;
  }

  // Merge's own options (lowercase/removeExtraSymbols/removeDuplicates)
  // already cleaned the combinations - convertMatchTypes is reused here only
  // for match-type wrapping and the 80-char flagging pass (TRD §5.2), not a
  // second cleanup pass.
  const matchTypeResult = convertMatchTypes(
    mergeResult.combinations,
    matchTypes,
    {},
  );
  self.postMessage({
    status: "ok",
    ...matchTypeResult,
  } satisfies MergeWorkerResponse);
};

export {};
