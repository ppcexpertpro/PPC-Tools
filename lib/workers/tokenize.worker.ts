import {
  tokenizeAndCount,
  type NgramSize,
  type TokenizeFilters,
  type TokenizeResult,
} from "@/lib/algorithms/tokenize";

export interface TokenizeWorkerRequest {
  terms: string[];
  ngramSizes: NgramSize[];
  filters: TokenizeFilters;
}

export type TokenizeWorkerResponse = TokenizeResult;

self.onmessage = (event: MessageEvent<TokenizeWorkerRequest>) => {
  const { terms, ngramSizes, filters } = event.data;
  const result = tokenizeAndCount(terms, ngramSizes, filters);
  self.postMessage(result satisfies TokenizeWorkerResponse);
};

export {};
