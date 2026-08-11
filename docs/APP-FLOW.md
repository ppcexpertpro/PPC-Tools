# App Flow — PPC Keyword Utilities Suite

## 1. Per-Tool End-to-End Flow

### 1.1 Keyword Match Type Tool

1. **Landing:** User arrives at `/keyword-match-type/` (direct nav, search engine, or suite home card). Sees H1, short explainer, and the input textarea already focused/ready — no clicks needed to start typing.
2. **Input:** User pastes or types keywords, one per line. Live line count updates under the textarea on every keystroke.
3. **Configuration:** User checks one or more match types (Broad/Phrase/Exact/BMM) and any processing toggles (dedupe, lowercase, strip special characters, sort). Defaults: Broad checked, Remove duplicates on, everything else off.
4. **Processing:** User clicks **Process** (or `Ctrl/Cmd+Enter`). If input is within normal limits, output renders in well under a second with no visible loading state; if near/at the line-count limit, an inline error blocks processing until resolved (see UX-DESIGN §3.1).
5. **Output:** One block per selected match type renders with its own count and Copy button; any flagged (>80-char) lines appear in a collapsed "Flagged" list below.
6. **Export/copy:** User clicks a per-block **Copy** or the global **Copy All**, gets immediate "Copied!" confirmation, pastes directly into Google Ads Editor or a spreadsheet.
7. **Iterate:** User can adjust options and re-click Process without losing their input (per UX principle "never lose input") to try different match-type combinations against the same list.

### 1.2 Keyword Merge & Match Tool

1. **Landing:** User arrives at `/keyword-merge-match/`. Sees 2 empty group cards by default (Group 1, Group 2) plus "+ Add group."
2. **Input:** User fills Group 1 (e.g. modifiers: best, top, cheap) and Group 2 (e.g. core terms: running shoes, hiking boots); optionally adds up to 3 more groups (suffixes, locations, etc.) and reorders via drag handle (desktop) or up/down buttons (mobile).
3. **Live feedback:** As soon as ≥2 groups have content, the "Will generate N keywords" counter appears and updates (debounced ~150ms) with every edit — this happens *before* any processing, so the user can see combinatorial size and trim groups proactively.
4. **Configuration:** User sets utility toggles (remove dupes, lowercase, strip symbols) and selects match type(s) to apply to the merged output.
5. **Processing:** User clicks **Merge & Process**. If predicted count is under the 20,000 cap, the merge + match-type conversion runs (in a Web Worker per TRD §7) and output renders; if over cap, the button stays disabled with the over-limit message until groups are trimmed.
6. **Output:** Same output block shape as Tool 1 — one block per selected match type, each with count and Copy, plus global Copy All.
7. **Export/copy:** Same copy/paste-into-Ads-Editor pattern as §1.1.

### 1.3 Negative Keyword Finder Tool

1. **Landing:** User arrives at `/negative-keyword-finder/`. Sees paste textarea and file dropzone both available up front (not gated behind a "choose your input method" step).
2. **Input:**
   - **Paste path:** user pastes search terms directly, one per line → proceeds straight to tokenization once they interact with the filter bar or click a "Find negatives" action.
   - **File path:** user drags/selects a `.csv`/`.xls`/`.xlsx`/`.txt` file → client-side parse begins immediately with a staged progress message ("Reading file…" → "Counting words…"). If the search-term column is ambiguous, a column picker blocks further progress until resolved.
3. **Tokenization:** Once terms are available (from paste or resolved file column), tokenization runs automatically (no separate "Process" click needed here, since this step is comparatively lightweight and users expect to explore interactively) and the frequency table renders, sorted by count descending, unigrams shown by default.
4. **Filter/explore:** User adjusts filter bar (toggle bigrams/trigrams, hide/show stopwords, adjust min length/frequency) — table re-sorts/re-filters live. User scans for junk/irrelevant tokens.
5. **Selection:** User clicks tokens to add them to the "Selected negatives" panel; panel updates its count live and stays visible (sticky rail desktop / bottom sheet mobile) while the user keeps scrolling and clicking more tokens.
6. **Export configuration:** User picks the negative match type (Broad/Phrase/Exact) for export.
7. **Export/copy:** User clicks **Copy** or **Download .txt**, gets confirmation, pastes the result into a new Negative Keyword List in Google/Bing Ads.

## 2. Cross-Tool Flows

- **Negative Keyword Finder → Keyword Match Type:** After a user exports/copies their selected negatives, a contextual prompt appears near the export action: *"Building your negative list into a new campaign? Format it as exact/phrase match with the Keyword Match Type Tool →"* linking to `/keyword-match-type/`. This is the most natural next step since exported negatives often need the same match-type wrapping treatment as regular keywords.
- **Keyword Merge & Match → Negative Keyword Finder:** After a large merged list is generated, a secondary prompt suggests: *"Once these are live, mine your search terms report for negatives →"* linking to `/negative-keyword-finder/` — framed as a "later in your workflow" suggestion, not immediate, since it depends on the campaign having run first.
- **Suite home → any tool:** the home page card grid is the entry point for users who don't yet know which tool they need; each card's one-line description is written to help a user self-select (e.g. "Already have a list? Format it." vs "Building a list from scratch? Combine it." vs "Cleaning up live campaigns? Mine your negatives.").
- **Header tool switcher:** present on every route (per UX-DESIGN §1) so cross-tool movement is always one click away regardless of which contextual prompt (if any) the user has seen.

## 3. System-Level Client-Side Processing Pipeline

This is the shared shape every tool's processing follows, per TRD §3–§5:

```
┌─────────┐   ┌────────────┐   ┌───────────┐   ┌─────────┐   ┌──────────┐
│  INPUT   │ → │ VALIDATION │ → │ TRANSFORM │ → │ RENDER   │ → │  EXPORT   │
└─────────┘   └────────────┘   └───────────┘   └─────────┘   └──────────┘
 paste text     line/row count    match-type      output       clipboard
 file upload    file size/type    conversion,     blocks,      copy, or
 (Neg. Finder)  column detection  merge product,  frequency    file
                (Neg. Finder)     or tokenize      table        download
                                  (in Web Worker)
                     │
                     ▼
              limit exceeded? → blocked state with explicit
              message (TRD §9 Error Handling), pipeline halts
              before TRANSFORM runs
```

- **INPUT:** never sent anywhere off-device; read directly into browser memory (string from textarea, or parsed via FileReader/PapaParse/SheetJS for uploads).
- **VALIDATION:** cheap, synchronous, main-thread checks (length, size, structure) that happen *before* any expensive transform is dispatched — this is deliberate so a user hits a clear limit message instantly rather than waiting through a worker run that would fail anyway.
- **TRANSFORM:** the actual algorithm from TRD §5, run in a Web Worker for anything above trivial input size, keeping the tab responsive.
- **RENDER:** results come back from the worker and populate React state that drives the output components from UX-DESIGN §4 (output blocks, frequency table, etc.), with virtualization for large row counts.
- **EXPORT:** clipboard write (with fallback shim per TRD §8) or file download via `URL.createObjectURL` — this is the only "leaves the browser" boundary, and even then only when the user explicitly initiates it; nothing auto-uploads or phones home.
