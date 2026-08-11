# Technical Requirements Document — PPC Keyword Utilities Suite

## 1. Tech Stack & Rationale

| Layer | Choice | Rationale |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | File-based routing gives each tool an SEO-crawlable route for free; static generation (SSG) for landing/marketing content per tool; TypeScript catches shape bugs in parsing/transform logic where correctness matters most |
| Styling | **Tailwind CSS** | Fast to build a consistent shared design system; utility classes keep the shared component library's visual language enforceable across tools without a heavy custom CSS layer |
| Client state | **React state + Zustand** (see §6) | No need for a heavy global store; Zustand covers the few cross-component concerns (e.g. shared toast queue, active tool's processing state) without Redux boilerplate |
| File parsing | **PapaParse** (CSV) + **SheetJS / `xlsx`** (XLS/XLSX) | Both are mature, client-side-capable, handle large files via streaming/worker-friendly APIs |
| Heavy computation | **Web Workers** (native, via Next.js worker loader or Comlink) | Keeps tokenization/permutation/match-type work off the main thread for large lists (see §7 Performance) |
| Hosting | **Vercel** | Zero-config Next.js hosting, static + edge-friendly, matches the JAMstack/no-mandatory-backend requirement |
| Analytics | **GA4** (or Plausible if privacy positioning is prioritized — see §11) | Lightweight event tracking without needing a backend |

**Assumption:** No backend service is stood up in v1. The only "server" involvement is Next.js's static/edge rendering of marketing shell + routes; all tool logic runs in the browser. If v2 adds accounts/saved lists, that introduces the first real backend (see Implementation Plan, Phase 5+ note).

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Next.js App (Vercel)                     │
│                                                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Shared App Shell                         │  │
│  │  Header / Nav · Footer · Tool Switcher · Toast Provider     │  │
│  └───────────────────────────────────────────────────────────┘  │
│         │                  │                     │                │
│  ┌────────────┐    ┌───────────────┐    ┌──────────────────┐   │
│  │ /keyword-   │    │ /keyword-     │    │ /negative-       │   │
│  │ match-type  │    │ merge-match   │    │ keyword-finder   │   │
│  │             │    │               │    │                   │   │
│  │ Tool Page   │    │ Tool Page     │    │ Tool Page         │   │
│  │ (SSG shell  │    │ (SSG shell    │    │ (SSG shell        │   │
│  │  + client   │    │  + client     │    │  + client         │   │
│  │  island)    │    │  island)      │    │  island)          │   │
│  └──────┬──────┘    └───────┬───────┘    └─────────┬─────────┘   │
│         │                   │                       │             │
│         └───────────┬───────┴───────────┬───────────┘             │
│                      │                   │                        │
│           ┌──────────▼─────────┐  ┌──────▼──────────┐            │
│           │  Shared Component   │  │  Shared Utils /  │            │
│           │  Library            │  │  Lib             │            │
│           │  (Button, Textarea, │  │  (validation,    │            │
│           │  Dropzone, Chip,    │  │  clipboard, file │            │
│           │  MatchTypeSelector, │  │  helpers, worker │            │
│           │  Toast, CopyButton) │  │  bridge)          │            │
│           └─────────────────────┘  └──────┬───────────┘            │
│                                            │                        │
│                                   ┌────────▼─────────┐              │
│                                   │   Web Workers      │              │
│                                   │  matchType.worker   │              │
│                                   │  merge.worker        │              │
│                                   │  tokenize.worker     │              │
│                                   └────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                     No network calls carry keyword/file data.
        Only anonymized usage events (tool used, action taken) leave
        the browser, via the analytics snippet described in §11.
```

Each tool route renders a statically-generated shell (marketing copy, headings, FAQ — good for SEO and fast LCP) that hydrates into a "client island": an interactive React component tree that owns that tool's input/output state. The shared shell (nav, footer, toast layer) wraps every route via the Next.js root layout.

## 3. Data Flow Per Tool

### 3.1 Keyword Match Type
```
Textarea input (controlled component, debounced)
   → on Process click: raw text → split lines → validate/clean
   → dispatch to matchType.worker with { lines, options, matchTypes }
   → worker returns { results: { broad: [...], phrase: [...], exact: [...], bmm: [...] }, flagged: [...] }
   → render output blocks + flagged list
   → Copy / Copy All reads from in-memory results, writes to clipboard API
```

### 3.2 Keyword Merge & Match
```
N group textareas (controlled, each debounced)
   → live counter: recompute product of non-empty group lengths on every change (cheap, main thread, no worker needed)
   → on Process click: groups[] → merge.worker
   → worker: dedupe within each group → cartesian product in group order → apply utility toggles → apply match types
   → worker returns { merged: [...], countsByType: {...} }
   → render output blocks identical in shape to §3.1's output
```

### 3.3 Negative Keyword Finder
```
Paste OR file upload
   → if file: FileReader → PapaParse (csv) or xlsx.read (xls/xlsx) → column detection/selection
   → normalized list of search-term strings (from paste or parsed column)
   → dispatch to tokenize.worker with { terms, ngramSizes, filters }
   → worker: tokenize → build frequency maps per n-gram size → apply stopword/length/frequency filters
   → worker returns { unigrams: [{token,count}], bigrams: [...], trigrams: [...] }
   → render sortable frequency table(s)
   → click token → add/remove from "selected negatives" (main-thread state, no worker round-trip needed)
   → export: apply chosen match type wrapper to selected tokens → clipboard or file download
```

## 4. File Parsing Approach

| File type | Library | Notes |
|---|---|---|
| `.csv` | PapaParse | Stream-parse with `worker: true` option so large CSVs don't block the main thread even before our own tokenize worker runs; header row auto-detected |
| `.xls` / `.xlsx` | SheetJS (`xlsx`) | Read via `FileReader.readAsArrayBuffer`, parse first sheet (`workbook.SheetNames[0]` per PRD §5.3 assumption), convert to JSON rows with `XLSX.utils.sheet_to_json` |
| `.txt` | Native `FileReader.readAsText` | Treated as one search term per line, same as paste path |

**Column detection algorithm (plain language):**
1. Read the header row (first row) of the parsed data.
2. Normalize each header cell: lowercase, trim, strip punctuation.
3. Check against a known-alias list: `search term`, `search terms`, `query`, `keyword`, `keywords`.
4. If exactly one column matches → auto-select it, proceed.
5. If zero or multiple columns match → surface a `<select>` populated with all column headers, block processing until the user picks one.
6. Re-run detection whenever a new file is uploaded (don't persist a stale column choice across different files).

**Size/row enforcement:** File size checked immediately on `input[type=file]` change event (before reading) against the 10MB cap from PRD §5.3. Row count checked after parse completes, against the 50,000-row cap; if exceeded, discard the parsed result and show the limit error rather than truncating silently.

## 5. Core Algorithms (Pseudocode)

### 5.1 Match-Type Conversion
```
function convertMatchTypes(lines, selectedTypes, options):
    cleaned = []
    flagged = []
    seen = new Set()  # for dedupe, case-insensitive

    for line in lines:
        text = line.trim()
        if text is empty: continue

        if options.stripSpecialChars:
            text = removeDisallowedChars(text)   # keep letters, numbers, spaces, - ' &
        if options.trimExtraWhitespace:
            text = collapseSpaces(text)
        # normalize away any existing match-type wrapper before re-wrapping
        text = stripExistingWrapper(text)          # "word" -> word, [word] -> word, +w +w -> w w

        if options.lowercase:
            text = text.toLowerCase()

        if length(text) > 80:
            flagged.push(text)
            continue   # not silently dropped from the UI, just excluded from valid output

        dedupeKey = text.toLowerCase()
        if options.removeDuplicates and seen.has(dedupeKey):
            continue
        seen.add(dedupeKey)
        cleaned.push(text)

    if options.sortAlphabetically:
        cleaned = sort(cleaned)

    results = {}
    if "broad" in selectedTypes:  results.broad  = cleaned.map(k => k)
    if "phrase" in selectedTypes: results.phrase = cleaned.map(k => `"${k}"`)
    if "exact" in selectedTypes:  results.exact  = cleaned.map(k => `[${k}]`)
    if "bmm" in selectedTypes:    results.bmm    = cleaned.map(k => k.split(" ").map(w => "+" + w).join(" "))

    return { results, flagged, validCount: length(cleaned) }
```

### 5.2 Permutation Merge
```
function mergeGroups(groups, options):
    # groups: ordered list of { label, lines[] }
    nonEmptyGroups = groups.filter(g => g.lines.length > 0)
    if nonEmptyGroups.length < 2:
        return { error: "NEEDS_MORE_GROUPS" }

    # dedupe within each group first to reduce combinatorial blowup
    for g in nonEmptyGroups:
        g.lines = dedupeCaseInsensitive(g.lines)

    predictedCount = product(g.lines.length for g in nonEmptyGroups)
    if predictedCount > 20000:
        return { error: "TOO_MANY_COMBINATIONS", predictedCount }

    combinations = [""]
    for g in nonEmptyGroups:
        combinations = [ (prefix + " " + term).trim() for prefix in combinations for term in g.lines ]

    if options.lowercase:
        combinations = combinations.map(c => c.toLowerCase())
    if options.removeExtraSymbols:
        combinations = combinations.map(collapseSpacesAndStripDisallowed)
    if options.removeDuplicates:
        combinations = dedupeCaseInsensitive(combinations)

    return { combinations, count: combinations.length }

# merged output is then passed through convertMatchTypes() from §5.1 for the selected match types
```

### 5.3 Tokenization / Negative-Keyword Extraction
```
function tokenizeAndCount(terms, ngramSizes, filters):
    frequency = { 1: Map(), 2: Map(), 3: Map() }   # only populated for requested ngramSizes
    totalRows = terms.length

    for term in terms:
        text = term.trim().toLowerCase()
        if text is empty: continue
        words = text.split(/\s+/).filter(w => w.length > 0)

        for n in ngramSizes:
            for i in range(0, words.length - n + 1):
                gram = words.slice(i, i + n).join(" ")
                frequency[n].set(gram, (frequency[n].get(gram) or 0) + 1)

    results = {}
    for n in ngramSizes:
        rows = [ {token: k, count: v, pctOfRows: v / totalRows} for (k, v) in frequency[n] ]
        rows = rows.filter(r =>
            r.token.length >= filters.minLength and
            r.count >= filters.minFrequency and
            (not filters.hideStopwords or not isStopwordOnly(r.token, STOPWORD_LIST))
        )
        rows.sort(by count, descending)
        results[n] = rows

    return results
```

## 6. State Management Approach

- **Per-tool local state** (input text, options, results) lives in each tool's own React component tree via `useState`/`useReducer` — kept fully isolated so tools never leak state into one another.
- **Zustand store (app-level, minimal)** handles only genuinely cross-cutting concerns:
  - Toast/notification queue (shared `Toast` component used by all tools for "Copied!", errors, warnings).
  - Active processing flag (drives a shared top-of-page progress indicator when a worker is running).
- No global state library manages tool input/output data — this keeps each tool's client bundle able to code-split cleanly and avoids one tool's state shape constraining another's.
- Debouncing (see UX-DESIGN.md §Interaction Details) is implemented via a shared `useDebouncedValue` hook, not stored in global state.

## 7. Performance Requirements

- **Target:** lists up to **10,000 lines** (or merge outputs up to the 20,000-keyword cap) process without the main thread blocking for more than one animation frame (~16ms) at a time — i.e., the UI (spinner, progress text) stays responsive throughout.
- **Approach:** all O(n) or worse transform work (match-type conversion, cartesian merge, tokenization) runs inside a Web Worker, not the main thread. The main thread only handles: reading input, posting to the worker, showing a loading state, and rendering the returned result.
- **Chunked postMessage for very large outputs:** if a worker result exceeds ~5,000 rows, the worker streams results back in chunks (e.g. 1,000 rows per `postMessage`) rather than one giant payload, so the UI can start rendering the output list progressively instead of waiting on the full result.
- **List rendering:** any output list rendered in the DOM above ~1,000 visible rows uses virtualization (e.g. `react-window`) so the browser never mounts more DOM nodes than are actually visible in the viewport.
- **File parsing:** PapaParse's `worker: true` mode is used for CSV so parsing itself doesn't compete with the main thread even before tokenization begins.

## 8. Browser Support

- **Supported:** last 2 versions of Chrome, Edge, Firefox, Safari (desktop + mobile). This covers the realistic device mix for the target personas (work laptops, some mobile/tablet use).
- **Required browser APIs:** Web Workers, Clipboard API (`navigator.clipboard.writeText`), FileReader, `URL.createObjectURL` (for file downloads). All are broadly supported in the target browser matrix.
- **Clipboard fallback:** if `navigator.clipboard` is unavailable (older browser or non-HTTPS context edge case), fall back to a hidden-textarea + `document.execCommand('copy')` shim, with a visible "select and copy manually" affordance as the last resort.
- **No IE11 support** (not a realistic share of the target personas' work environments).

## 9. Error Handling Strategy

| Error class | Handling |
|---|---|
| **Invalid/empty input** | Inline, non-blocking guidance text near the input (not a modal/toast) — e.g. "Add at least one more group to merge" |
| **Limit exceeded** (line count, file size, row count, predicted merge count) | Blocking state: Process/Upload action disabled, clear message stating the limit and the current value, no partial/silent truncation |
| **File parsing failure** (corrupt file, unsupported structure) | Toast + inline error panel: "We couldn't read this file — check it's a valid CSV/XLS/XLSX" with a retry affordance (re-upload) |
| **Worker crash / unexpected exception** | Caught at the worker-bridge layer; falls back to a generic "Something went wrong processing your list — try again or reduce the list size" toast; error is logged to analytics as an exception event (see §11) with no keyword content attached |
| **Clipboard write failure** | Falls back to the manual-copy shim described in §8, with a toast explaining why |

General principle: **never fail silently**. Every rejected/blocked action tells the user why and what to do next.

## 10. Accessibility (WCAG 2.1 AA)

- All interactive controls (checkboxes, toggles, buttons, dropzone) are keyboard-operable and have visible focus states.
- Textareas and file inputs have associated `<label>` elements (not placeholder-only labeling).
- Match-type selector and n-gram toggles use proper `role="group"` + `aria-label` grouping so screen readers announce them as related controls.
- Color is never the sole indicator of state (e.g. "flagged" keywords get an icon + text label, not just a red highlight).
- Toast notifications use `aria-live="polite"` regions so screen reader users hear "Copied to clipboard" without focus being stolen.
- Contrast ratios meet AA (4.5:1 body text, 3:1 large text/UI components) across the design system's light and dark tokens.
- File dropzone is a real, labeled button/input under the hood (drag-and-drop is progressive enhancement, not the only path to upload).

## 11. Analytics / Telemetry Plan

- **Tool:** GA4 (or Plausible — **Open question, see PRD §8** — this doc assumes GA4-style custom events either way).
- **Events tracked** (no keyword/file content ever included in event payloads):
  - `tool_view` (tool name, referrer)
  - `process_run` (tool name, input size bucket e.g. "1-100/101-1000/1000+", options selected)
  - `value_action` (tool name, action type: copy / copy_all / download)
  - `limit_hit` (tool name, limit type: line_count / file_size / row_count / merge_cap)
  - `error_occurred` (tool name, error class from §9 — no stack trace or content)
- **Privacy stance:** because "no keyword data leaves the browser" is a core product promise (PRD §1), event payloads are audited to guarantee no free-text keyword content is ever included, even in error events.

## 12. Testing Strategy

| Layer | Approach |
|---|---|
| **Unit tests** | Vitest (or Jest) for the pure functions in §5 (convertMatchTypes, mergeGroups, tokenizeAndCount) and file-parsing helpers — these are the highest-value, easiest-to-isolate tests since they're pure input→output transforms with no DOM |
| **Component tests** | React Testing Library for shared components (MatchTypeSelector, Dropzone, CopyButton) and per-tool interaction (e.g. "typing in Group 1 updates the live counter") |
| **E2E tests** | Playwright, covering the golden path for each tool end-to-end (paste input → select options → process → copy/export) plus at least one limit-exceeded path per tool |
| **Performance regression check** | A Playwright/Node script that runs the core algorithms against a fixed 10,000-line fixture and asserts processing completes under a defined time budget, run in CI to catch regressions |
| **Accessibility checks** | Automated `axe-core` scan (via `@axe-core/playwright` or jest-axe) run against each tool page as part of E2E/CI |
