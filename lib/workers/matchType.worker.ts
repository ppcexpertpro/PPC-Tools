import {
  convertMatchTypes,
  type MatchType,
  type MatchTypeOptions,
  type MatchTypeResult,
} from "@/lib/algorithms/matchType";

export interface MatchTypeWorkerRequest {
  lines: string[];
  selectedTypes: MatchType[];
  options: MatchTypeOptions;
}

export type MatchTypeWorkerResponse = MatchTypeResult;

self.onmessage = (event: MessageEvent<MatchTypeWorkerRequest>) => {
  const { lines, selectedTypes, options } = event.data;
  const result = convertMatchTypes(lines, selectedTypes, options);
  self.postMessage(result satisfies MatchTypeWorkerResponse);
};

export {};
