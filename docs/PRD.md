# Product Requirements Document — PPC Keyword Utilities Suite

## 1. Purpose & Problem Statement

PPC specialists rebuild the same keyword lists by hand, over and over: converting a list to Broad/Phrase/Exact match, combining modifier + core-term + suffix lists into every permutation, and mining a search-terms report for junk words to add as negatives. Today this happens in spreadsheets, Notepad, or dated, non-mobile-friendly single-purpose tools (e.g. the dgency.com utilities this suite is modeled on).

The PPC Keyword Utilities Suite is a free, no-login, browser-based set of tools that removes this friction: paste in raw data, get clean, Ads-Editor-ready output in seconds, with **all processing happening client-side** — no keyword or account data ever leaves the user's browser. Secondary purpose: the suite is also a content-marketing / lead-gen surface for the operating PPC agency, so SEO-friendly landing content and (later) a non-intrusive email-gated export are part of the product, not an afterthought.

## 2. Target Users / Personas

| Persona | Context | Goals | Pain Points | Technical Comfort |
|---|---|---|---|---|
| **In-house PPC Specialist** | Manages 1–3 accounts for a single brand/employer | Fast, accurate match-type formatting before uploading to Ads Editor; wants a tool she can trust with real campaign data | Existing tools feel dated, break on mobile, or she doesn't trust pasting client data into an unknown site | Comfortable with Google Ads UI and Editor; not a developer |
| **Agency Account Manager** | Juggles 5–20+ client accounts simultaneously | Needs consistent, repeatable output across many clients quickly; often building lists on a laptop between client calls, sometimes on a tablet/phone | Context-switching overhead; needs output that's clean enough to paste into client-facing sheets without cleanup; privacy is a real concern (client data) | High Ads Editor fluency; time-poor |
| **Freelancer / Independent Consultant** | Solo operator, wears strategist + builder + reporter hats | Wants free, no-signup tools that just work; values being able to work across Google Ads and Microsoft/Bing Ads conventions | Budget-conscious (won't pay for a point solution); needs tools usable on inconsistent hardware/connections | Moderate–high; self-taught on tooling |

**Assumption:** All three personas are optimizing for Google Ads primarily, with Microsoft/Bing Ads as a close secondary use case (match-type syntax is shared between the two platforms), so v1 does not need platform-specific output modes.

## 3. Goals & Non-Goals

### Goals (v1)
- Convert, merge, and mine keyword lists in under a few seconds for typical list sizes, with zero perceived UI freeze.
- 100% client-side processing — no keyword text or uploaded file content is transmitted to a server.
- One shared design system / shell across all tools so switching tools feels like the same product.
- SEO-indexable landing pages per tool (each tool is its own crawlable route with real content, not just an app shell).
- Mobile-responsive down to a single-column phone layout for at least the Match Type and Merge & Match tools (Negative Keyword Finder's table-heavy UI may reasonably favor tablet+ — see §12 UX doc).
- Structure the codebase so a 4th/5th tool (Convert Case, UTM Builder) can be added as a new route + shared components, not a rewrite.

### Non-Goals (v1)
- No user accounts, login, or saved history/lists (evaluate for v2).
- No direct push/sync to Google Ads or Microsoft Ads accounts via API.
- No keyword research data (search volume, CPC estimates, competition) — this suite formats and mines lists the user already has, it does not generate new keyword ideas from an external data source.
- No team/collaboration features (shared workspaces, comments).
- No multi-language UI (English only in v1).
- No automatic conflict-checking of negative keywords against a live Ads account.

## 4. Success Metrics / KPIs

| Metric | Why it matters | v1 target (directional) |
|---|---|---|
| Weekly sessions per tool | Core usage/adoption signal | Track as baseline, no fixed target at launch |
| Median keywords processed per session | Indicates real (not toy) usage | > 50 keywords/session |
| "Value actions" per session (copy, copy-column, download) | Proxy for the tool actually delivering usable output | ≥ 1 per session for > 60% of sessions |
| Core Web Vitals (LCP, INP, CLS) | Tools double as SEO/lead-gen landing pages | LCP < 2.5s, INP < 200ms, CLS < 0.1 (all "Good" per CrUX thresholds) |
| 30-day return rate | Tool becomes a bookmarked daily-use utility | Track as baseline |
| Email-gated export conversion (v2, once shipped) | Lead-gen goal of the suite | Defined when v2 gating is scoped |

## 5. Functional Requirements Per Tool

### 5.1 Keyword Match Type Tool

**Purpose:** Convert a raw keyword list into one or more Google/Bing Ads match-type formats simultaneously.

| Aspect | Requirement |
|---|---|
| **Primary input** | Multi-line textarea, one keyword phrase per line (paste or type) |
| **Match type options** | Checkboxes, multi-select, at least one required to process: **Broad** (`keyword`), **Phrase** (`"keyword"`), **Exact** (`[keyword]`), **Broad Match Modifier / BMM** (`+word +word`) |
| **Processing options** | Toggles: Lowercase all, Trim extra whitespace (collapse multiple spaces), Strip special characters (keep letters, numbers, spaces, and `- ' &`), Remove duplicate lines (case-insensitive), Sort output alphabetically |
| **Output** | One output block per selected match type, each showing: formatted list, live count, "Copy" button (per block) and a global "Copy All" (all selected types, grouped) |
| **Limits** | Max **5,000 input lines** per run (v1 soft cap; UI warns above 2,000 lines that processing may take a moment, hard-stops with a clear message above 5,000) |
| **Validation** | Blank lines ignored (not counted). Lines exceeding **80 characters** (Google Ads' published max keyword length) are flagged in a separate "Needs review" list, shown but not silently dropped. |

**Assumption:** BMM (`+word +word`) is included because it remains common in exported legacy lists and is still honored as an input format in Bing Ads UI conventions, even though Google Ads folded BMM behavior into Phrase match in 2021. The tool labels it "Broad Match Modifier (legacy)" in the UI to avoid implying it's a distinct Google Ads match type today.

**Edge cases:**
- Input containing only blank lines/whitespace → output is empty state, not an error.
- A line that's already wrapped in quotes or brackets by the user → tool strips existing match-type wrapper characters before reapplying, so re-processing already-formatted lists doesn't double-wrap (e.g. `"running shoes"` → treated as `running shoes` before Exact conversion produces `[running shoes]`).
- Duplicate keywords differing only by case (`Running Shoes` vs `running shoes`) → collapsed into one when "Remove duplicates" is on, keeping the first occurrence's original casing (unless "Lowercase all" is also on).

### 5.2 Keyword Merge & Match Tool

**Purpose:** Combine multiple keyword "groups" (modifiers, core terms, suffixes, etc.) into every permutation, then apply match types to the merged output.

| Aspect | Requirement |
|---|---|
| **Primary input** | 2–5 "groups," each its own labeled multi-line textarea (e.g. Group 1, Group 2 … user can rename labels). Minimum 2 groups to merge; "Add Group" up to 5. |
| **Merge logic** | Cartesian product across groups **in the order the groups are arranged on screen** (Group 1 × Group 2 × Group 3 …), each combination joined with a single space, groups reorderable via drag handle |
| **Utility toggles** | Lowercase transform, Remove extra symbols (collapse whitespace, strip disallowed characters), Remove duplicate resulting keywords |
| **Match type application** | Same match-type checkbox set as §5.1, applied to the merged output |
| **Live feedback** | Running "This will generate **N** keywords" counter, computed from group sizes (`len(group1) × len(group2) × …`) and updated on every keystroke/blur, **before** the user clicks Process |
| **Limits** | Predicted output capped at **20,000 merged keywords**; if the live counter exceeds this, the Process button is disabled and the counter turns into a warning ("Reduce group sizes — currently would generate 34,500 keywords, max is 20,000") |
| **Output** | Merged + match-typed list with count, "Copy All," same per-match-type blocks as §5.1 |

**Assumption:** v1 merge order is fixed to the on-screen group order (drag-to-reorder groups is allowed, but the tool does not additionally generate all *permutations of group order* — i.e., it will not also produce "shoes running best" from groups ["best"], ["running shoes"]). Full order-permutation is called out as a v2 "Advanced merge" option in §8.

**Edge cases:**
- A group left empty while others have content → that empty group is skipped entirely from the cartesian product (not treated as a blocking error), so 2 non-empty groups still merge even if a 3rd empty group exists.
- Only 1 group has content → no merge possible; UI shows inline guidance "Add at least one more group to merge" rather than a generic error.
- A single group's own list contains duplicate lines → deduplicated within that group before the cartesian product runs, to avoid needless combinatorial blowup.

### 5.3 Negative Keyword Finder Tool

**Purpose:** Break a pasted or uploaded keyword/search-term list into candidate words, surface frequency, and let the user hand-pick negative keyword candidates.

| Aspect | Requirement |
|---|---|
| **Primary input** | Paste into textarea **or** upload file: `.csv`, `.xls`, `.xlsx`, `.txt` |
| **Column detection (file upload)** | Auto-detects a column named (case-insensitive) `search term`, `search terms`, `query`, or `keyword`; if none matches or multiple plausible columns exist, shows a dropdown for the user to pick the correct column manually before processing |
| **Tokenization** | Breaks each row/line into tokens; toggle for **Unigram** (single words, default on), **Bigram**, **Trigram** — multiple can be active at once, each shown as its own frequency table |
| **Frequency table** | Sortable table: Token, Occurrence count, % of rows containing it; sorted by count descending by default |
| **Filters** | "Hide common words" (English stopword list: a, the, and, for, with, etc. — on by default), minimum word length (default 3 characters), minimum frequency (default 1, adjustable) |
| **Selection interaction** | Click any row/token to toggle it into a running "Selected negatives" panel; panel shows live count and is persistent while the user keeps browsing the frequency table |
| **Match type for export** | Selected negatives can be exported as Broad (`word`), Phrase (`"word"`), or Exact (`[word]`) negative format — reuses the match-type selector component from §5.1/§5.2 |
| **Export** | Copy selected list to clipboard, or download as `.txt`/`.csv` |
| **Limits** | Max file size **10MB**; max **50,000 rows** parsed per file (v1 cap — file is rejected with a clear message if exceeded, not silently truncated) |

**Edge cases:**
- Uploaded file has zero detectable text/search-term-like column → error state: "We couldn't find a search term column — try selecting one manually" with the manual column picker surfaced immediately.
- A search term is empty/whitespace-only after trimming → row skipped, not counted.
- Extremely short lists (< 5 rows) → frequency table still renders normally; no special-cased error, just naturally low counts.
- File with multiple sheets (`.xlsx`) → **Assumption:** v1 reads only the first sheet; UI shows a small note "Reading first sheet: '{sheet name}'" so the user isn't silently missing data on other tabs.

## 6. User Stories & Acceptance Criteria

**US-1 (Match Type):** *As a PPC specialist, I want to paste 200 keywords and get Broad, Phrase, and Exact versions at once, so I can upload all three match types to Ads Editor without reformatting by hand.*
- AC1: Given 200 valid keyword lines and all three match types checked, when I click Process, three output blocks render within 1 second, each with the correct wrapper syntax and a matching count of 200 (minus any deduped/flagged lines).
- AC2: Given the same input, when I click "Copy All," my clipboard contains all three formatted lists, clearly labeled/separated.

**US-2 (Merge & Match):** *As an agency account manager, I want to combine a "best/top/cheap" modifier list with a "running shoes/hiking boots" core list, so I don't have to manually type every combination.*
- AC1: Given Group 1 = 3 lines and Group 2 = 4 lines, the live counter shows "12" before I process.
- AC2: After processing with "Remove duplicate resulting keywords" on, if two different group combinations produce an identical merged string, only one instance appears in the output and the final count reflects the dedup.

**US-3 (Negative Keyword Finder):** *As a freelancer, I want to upload a search-terms CSV and quickly click through the noisiest words, so I can build a negative list in minutes instead of manually scanning hundreds of rows.*
- AC1: Given a CSV with a "Search terms" column and 1,000 rows, the unigram frequency table renders sorted by count descending, with stopwords hidden by default.
- AC2: When I click 5 tokens, the "Selected negatives" panel shows exactly those 5, in click order, with a live count of 5.
- AC3: When I select "Phrase" as export match type and click "Copy," my clipboard contains each selected word wrapped in quotes.

## 7. Out of Scope (v1)

- Server-side storage of any uploaded file or pasted list.
- Any form of user authentication.
- Direct API integration with Google Ads / Microsoft Advertising.
- Keyword search-volume or competition data (third-party data enrichment).
- Non-English stopword lists / UI localization.
- Team sharing, comments, or multi-user collaboration on a list.
- Native mobile apps (web-responsive only).

## 8. Assumptions & Open Questions

**Assumptions made in this document** (flagged individually above, summarized here):
- Google Ads' 80-character keyword limit and BMM's legacy status are the reference constraints for match-type validation.
- Merge & Match v1 does not permute group *order*, only combines groups in on-screen order.
- Negative Keyword Finder reads only the first sheet of multi-sheet Excel files in v1.
- All three personas primarily target Google Ads, with Bing/Microsoft Ads as a compatible secondary use case, so no platform-specific output mode is needed in v1.

**Open questions (for the requester to confirm before/during build):**
1. Should "Copy All" output include labeled headers per match type (e.g. `--- Exact Match ---`) or just raw stacked lists? (Recommend: labeled, toggleable off for users who want raw paste.)
2. What email-gating trigger is planned for v2 lead capture — gate exports over a certain size, gate all exports, or gate a bonus feature (e.g. saved lists) instead of gating core output? This materially affects whether v1 should stub the UI hook now.
3. Is Microsoft Clarity / GA4 (or another analytics stack) already standardized on for the parent agency site, or should this suite pick independently? (TRD assumes GA4 + a privacy-friendly event layer — see TRD §Analytics.)

## 9. v1 vs v2 Feature Split

| Feature | v1 | v2 |
|---|---|---|
| Match Type Tool (Broad/Phrase/Exact/BMM) | ✅ | — |
| Merge & Match Tool (fixed group order) | ✅ | — |
| Merge & Match: full group-order permutation ("Advanced merge") | — | ✅ |
| Negative Keyword Finder (paste + CSV/XLS/XLSX, unigram/bigram/trigram) | ✅ | — |
| Negative Keyword Finder: enrich tokens with clicks/cost/impressions from report columns | — | ✅ |
| Client-side only processing | ✅ | ✅ (stays true even if accounts are added) |
| User accounts / login | — | ✅ (evaluate) |
| Saved lists / history | — | ✅ (evaluate) |
| Email-gated export / lead capture | — | ✅ |
| Convert Case tool | — | ✅ (planned sibling tool) |
| UTM Builder tool | — | ✅ (planned sibling tool) |
| Direct Google Ads / Microsoft Ads account sync | — | Not currently planned; re-evaluate if requested |
