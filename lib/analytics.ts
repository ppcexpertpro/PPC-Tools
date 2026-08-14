export type ToolName =
  | "keyword-match-type"
  | "keyword-merge-match"
  | "negative-keyword-finder";

export type InputSizeBucket = "1-100" | "101-1000" | "1000+";

/**
 * TRD §11's five event shapes. Every field is a closed enum/string-literal
 * type or a number - there is no free-text field a caller could populate
 * with keyword/file content. That's enforced structurally here, not just by
 * convention, so it holds even as new call sites are added later.
 */
export type AnalyticsEvent =
  | { name: "tool_view"; tool: ToolName; referrer: string }
  | {
      name: "process_run";
      tool: ToolName;
      inputSizeBucket: InputSizeBucket;
      options: string[];
    }
  | {
      name: "value_action";
      tool: ToolName;
      action: "copy" | "copy_all" | "download";
    }
  | {
      name: "limit_hit";
      tool: ToolName;
      limitType: "line_count" | "file_size" | "row_count" | "merge_cap";
    }
  | { name: "error_occurred"; tool: ToolName; errorClass: string };

type Reporter = (event: AnalyticsEvent) => void;

const defaultReporter: Reporter = (event) => {
  if (process.env.NODE_ENV !== "production") {
    console.debug("[analytics]", event);
  }
};

let reporter: Reporter = defaultReporter;

/**
 * Swap in a real transport (GA4 gtag, Plausible, etc.) once an account/site
 * ID exists. Until then every event is logged in dev and dropped in prod -
 * no vendor is wired in, since that requires credentials only the project
 * owner can supply.
 */
export function setAnalyticsReporter(customReporter: Reporter): void {
  reporter = customReporter;
}

export function trackEvent(event: AnalyticsEvent): void {
  reporter(event);
}

export function bucketInputSize(count: number): InputSizeBucket {
  if (count <= 100) return "1-100";
  if (count <= 1000) return "101-1000";
  return "1000+";
}
