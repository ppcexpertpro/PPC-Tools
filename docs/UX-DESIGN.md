# UI/UX Design — PPC Keyword Utilities Suite

## 1. Information Architecture / Site Map

```
/  (Suite home)
├── /keyword-match-type/          Tool 1 landing + app
├── /keyword-merge-match/         Tool 2 landing + app
├── /negative-keyword-finder/     Tool 3 landing + app
├── /convert-case/                (v2, planned sibling)
├── /utm-builder/                 (v2, planned sibling)
└── shared shell present on every route:
    ├── Header: logo/wordmark, tool switcher nav, (v2: sign-in slot)
    └── Footer: about, links to each tool, agency lead-gen link, privacy note
```

- **Suite home (`/`)**: brief pitch on the suite + card grid linking to each tool (icon, one-line description, "Open tool" CTA). Doubles as the primary SEO landing page for "PPC keyword tools" style queries.
- **Each tool route is standalone-navigable**: a user arriving from a Google search on `/negative-keyword-finder/` gets full context (what it does, how to use it) without needing to have seen the suite home first.
- **Tool switcher** lives in the header on every tool page (not just the home page) so a user who finishes one tool can jump straight to the next without returning home first — this is also where the cross-tool suggestion from APP-FLOW.md surfaces.

## 2. Design Principles

1. **Get in, get your output.** The primary input control is visible above the fold with no scrolling, on both desktop and mobile. No login wall, no multi-step wizard for the core path.
2. **Show your work.** Live counts (keyword count, predicted merge count, selected negatives count) are always visible — the user should never have to click "Process" just to find out how big their list is.
3. **Never lose input.** Options/toggles never clear the textarea; switching a match-type checkbox re-renders output, not input state.
4. **One shared visual language, three focused tools.** Component styling (buttons, inputs, chips) is identical across tools; only the input/output *shape* differs per tool's actual task.
5. **Fast feedback, not fake delay.** Small inputs process instantly with no artificial loading spinner; only genuinely long-running processing (per TRD §7 thresholds) shows a progress indicator.

## 3. Wireframe-Level Description Per Tool

### 3.1 Keyword Match Type Tool

```
┌─────────────────────────────────────────────────────────┐
│ Header (logo · Match Type | Merge & Match | Neg. Finder)  │
├─────────────────────────────────────────────────────────┤
│ H1: Keyword Match Type Tool                               │
│ Short description + "how it works" (SEO copy, collapsible │
│ on mobile)                                                 │
├───────────────────────────┬─────────────────────────────┤
│  INPUT PANEL               │  OPTIONS PANEL               │
│  [ Textarea, one keyword   │  Match types:                │
│    per line ]              │   [x] Broad  [ ] Phrase       │
│  Live count: "128 keywords"│   [ ] Exact  [ ] BMM (legacy) │
│  [Clear] [Paste example]   │  Options:                     │
│                             │   [x] Remove duplicates       │
│                             │   [ ] Lowercase                │
│                             │   [ ] Strip special characters │
│                             │   [ ] Sort alphabetically       │
│                             │  [ Process ▶ ]  (primary CTA)  │
├───────────────────────────┴─────────────────────────────┤
│  OUTPUT (appears after Process; empty state before)        │
│  ┌───────────────┐ ┌───────────────┐                       │
│  │ Broad (128)    │ │ Phrase (128)   │  ...per selected type│
│  │ [Copy]         │ │ [Copy]         │                       │
│  │ list…          │ │ list…          │                       │
│  └───────────────┘ └───────────────┘                       │
│  [Copy All]     Flagged (2) ▸ expandable list                │
└─────────────────────────────────────────────────────────┘
```

- **Empty state:** output area shows a light illustration + "Your formatted keywords will appear here" — not a blank void.
- **Loading state:** only shown if processing exceeds ~300ms (avoids flash-of-spinner on small lists); output panel shows skeleton blocks matching the selected match-type count.
- **Error/limit state:** Process button becomes disabled with an inline red-bordered note directly under the textarea, e.g. "Max 5,000 lines — you have 5,412."

### 3.2 Keyword Merge & Match Tool

```
┌─────────────────────────────────────────────────────────┐
│ Header                                                     │
├─────────────────────────────────────────────────────────┤
│ H1: Keyword Merge & Match Tool                             │
├─────────────────────────────────────────────────────────┤
│ GROUPS (horizontal on desktop, stacked on mobile)           │
│ ┌───────────┐ ┌───────────┐ ┌───────────┐  [+ Add group]   │
│ │ Group 1 ⠿  │ │ Group 2 ⠿  │ │ Group 3 ⠿  │  (max 5)        │
│ │ [rename]   │ │ [rename]   │ │ [rename]   │                 │
│ │ textarea   │ │ textarea   │ │ textarea   │                 │
│ │ 3 lines    │ │ 4 lines    │ │ 2 lines    │                 │
│ └───────────┘ └───────────┘ └───────────┘                 │
│  ⠿ = drag handle to reorder groups                          │
│  Live counter: "Will generate 24 keywords"                  │
│  Utility toggles: [x] Remove dupes  [ ] Lowercase  [ ] Strip │
│  Match types: [x] Broad [ ] Phrase [ ] Exact [ ] BMM         │
│  [ Merge & Process ▶ ]                                       │
├─────────────────────────────────────────────────────────┤
│  OUTPUT — identical shape to Tool 1's output blocks           │
└─────────────────────────────────────────────────────────┘
```

- **Live counter states:** neutral gray text under normal counts; amber at 80% of the 20,000 cap; red + Process disabled once the cap is exceeded (per PRD §5.2).
- **Mobile:** groups stack vertically full-width; drag-to-reorder becomes up/down arrow buttons per group card (touch drag reordering is unreliable in a scrolling column, so this is an intentional mobile-specific control swap — see §5 Responsive Behavior).

### 3.3 Negative Keyword Finder Tool

```
┌─────────────────────────────────────────────────────────┐
│ Header                                                     │
├─────────────────────────────────────────────────────────┤
│ H1: Negative Keyword Finder                                 │
├───────────────────────────┬─────────────────────────────┤
│ INPUT                       │ SELECTED NEGATIVES (sticky)   │
│ [Paste textarea] — or —     │ Panel, persists while         │
│ [Dropzone: drag file or     │ scrolling the frequency table │
│  click to browse            │ "14 selected"                  │
│  .csv .xls .xlsx .txt]      │ chip list, each removable (×)  │
│ (if file, column picker      │ Match type for export:         │
│  appears here if ambiguous)  │  ( ) Broad (•) Phrase ( ) Exact│
│                              │ [Copy]  [Download .txt]        │
├───────────────────────────┴─────────────────────────────┤
│ FILTER BAR: n-grams [x]1 [ ]2 [ ]3 · [x] hide stopwords ·   │
│             min length [3] · min frequency [1]              │
├─────────────────────────────────────────────────────────┤
│ FREQUENCY TABLE (virtualized for large lists)                │
│ Token          Count   % of rows                              │
│ shoes          412     41%          [click row to select]     │
│ cheap          210     21%                                    │
│ ...                                                            │
└─────────────────────────────────────────────────────────┘
```

- **Selected negatives panel** is sticky/pinned on desktop (right rail) so it stays visible while the user scrolls a long frequency table; on mobile it collapses to a bottom sheet summary bar ("14 selected — View") to preserve vertical space for the table.
- **Empty state (no input yet):** frequency table area shows guidance copy + a sample screenshot/illustration of what the table will look like.
- **Loading state (file parsing/tokenizing):** progress text tied to actual parse/tokenize stage ("Reading file…" → "Counting words…") rather than a generic spinner, since file parsing can take a moment on large uploads.
- **Column-ambiguous state:** a blocking (but dismissible-to-cancel) inline panel asking the user to pick the search-term column before the frequency table renders.

## 4. Shared Component Inventory

| Component | Used by | Key states |
|---|---|---|
| `Button` | All | primary / secondary / disabled / loading |
| `Textarea` (with line counter) | Match Type, Merge & Match, Neg. Finder (paste) | default / focus / error-bordered |
| `Dropzone` (file upload) | Neg. Finder | idle / drag-over / uploading / error |
| `Chip` (removable tag) | Neg. Finder (selected negatives) | default / removable-hover |
| `MatchTypeSelector` | Match Type, Merge & Match, Neg. Finder (export) | multi-select (Tools 1–2) vs single-select radio mode (Tool 3 export) |
| `CopyButton` | All output blocks | idle / copied (brief checkmark + "Copied!" state, ~2s) |
| `Toast` | All | info / success / warning / error, `aria-live="polite"` |
| `Counter` (live count text) | All | neutral / warning (near-limit) / error (over-limit) |
| `GroupCard` (draggable input group) | Merge & Match | default / dragging / empty |
| `FrequencyTable` (virtualized) | Neg. Finder | default / sorted-by-column / row-selected |
| `EmptyState` | All (pre-process output area) | per-tool illustration + copy |
| `SkeletonBlock` | All (loading output) | shown only past the ~300ms threshold |

Every component is built once in a shared `packages/ui` (or `components/shared`) layer and consumed by all three tools — no per-tool forks of the same control (see Implementation Plan §Repo Structure).

## 5. Responsive Behavior

| Breakpoint | Match Type | Merge & Match | Neg. Finder |
|---|---|---|---|
| **Mobile (< 640px)** | Single column: input → options → output, stacked | Groups stack vertically, full-width; drag handle replaced by up/down buttons | Input full-width; selected-negatives panel collapses to a bottom summary bar; frequency table scrolls horizontally within its own container if needed |
| **Tablet (640–1024px)** | Input/options side-by-side if width allows, else stacked | 2 groups per row, wraps | Two-column (input | selected panel) preserved, table below |
| **Desktop (≥ 1024px)** | Input panel + options panel side by side, output full-width below | All groups in a horizontal row (scrollable if 5 groups exceed viewport) | Full desktop layout as wireframed in §3.3 |

General rules: no horizontal page scroll at any breakpoint (wide tables/output scroll within their own container, per accessibility/responsive best practice); all tap targets ≥ 44×44px on touch; sticky panels (selected negatives) only sticky on viewports tall enough to benefit (disabled below a min viewport height to avoid eating the whole screen).

## 6. Interaction Details

- **Live keyword counting:** every textarea shows a running line/keyword count below it, updated on every input event (cheap enough to run unthrottled on the main thread — this is just `split("\n").filter(Boolean).length`, not the heavy transform).
- **Debounced processing:** for "live preview" style feedback (e.g. Merge & Match's predicted-count counter recalculating group sizes), input changes are debounced ~150ms before recomputing, so fast typing doesn't recompute on every keystroke. The actual heavy Process step is always explicit (button click), never auto-triggered on input change, so users aren't surprised by output changing mid-paste.
- **Keyboard shortcuts:**
  - `Ctrl/Cmd + Enter` while focused in an input textarea triggers Process (same as clicking the primary CTA).
  - `Ctrl/Cmd + C` on a focused output block copies that block (mirrors clicking its Copy button) when the block itself has focus.
  - Standard tab order follows visual/reading order through input → options → CTA → output.
- **Drag-and-drop file upload (Neg. Finder):** dropzone accepts drag-over from anywhere on the page (not just the dropzone box itself) with a full-panel highlight on drag-enter, to reduce precision needed to hit a small target — falls back to click-to-browse as the accessible/primary path.
- **Copy feedback:** every copy action gives immediate, unambiguous confirmation — button label swaps to "Copied!" with a checkmark icon for ~2 seconds, plus a toast for screen-reader announcement.
- **Undo-safety:** "Clear" actions on textareas require a confirm only if the field has substantial content (> 20 lines) — trivial to accidentally clear, per principle "never lose input" in §2.
