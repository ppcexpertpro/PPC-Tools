# Implementation Plan — PPC Keyword Utilities Suite

## 1. Repo Structure / Folder Layout

```
ppc-tools/
├── docs/                          # this spec package
├── app/                            # Next.js App Router
│   ├── layout.tsx                  # root layout: shared shell (header/nav/footer/toast)
│   ├── page.tsx                    # suite home
│   ├── keyword-match-type/
│   │   ├── page.tsx                 # SSG landing shell + SEO content
│   │   └── MatchTypeApp.tsx         # client island (interactive tool)
│   ├── keyword-merge-match/
│   │   ├── page.tsx
│   │   └── MergeMatchApp.tsx
│   └── negative-keyword-finder/
│       ├── page.tsx
│       └── NegativeFinderApp.tsx
├── components/
│   ├── shared/                      # Button, Textarea, Dropzone, Chip, Toast,
│   │                                 # MatchTypeSelector, CopyButton, Counter,
│   │                                 # EmptyState, SkeletonBlock, FrequencyTable
│   └── layout/                      # Header, Footer, ToolSwitcher
├── lib/
│   ├── algorithms/
│   │   ├── matchType.ts             # pure fn from TRD §5.1
│   │   ├── merge.ts                 # pure fn from TRD §5.2
│   │   └── tokenize.ts              # pure fn from TRD §5.3
│   ├── workers/
│   │   ├── matchType.worker.ts
│   │   ├── merge.worker.ts
│   │   └── tokenize.worker.ts
│   ├── file-parsing/
│   │   ├── csv.ts                   # PapaParse wrapper
│   │   ├── excel.ts                 # SheetJS wrapper
│   │   └── columnDetection.ts
│   ├── validation/                  # limit checks from TRD §9
│   ├── clipboard.ts                 # write + fallback shim
│   └── analytics.ts                 # event tracking wrapper (TRD §11)
├── store/
│   └── uiStore.ts                   # Zustand: toasts, processing flag
├── tests/
│   ├── unit/                        # algorithms, file-parsing, validation
│   ├── component/                   # shared components, per-tool interaction
│   └── e2e/                         # Playwright specs per tool
├── public/
└── tailwind.config.ts
```

**Reuse principle:** every algorithm in `lib/algorithms/` is a pure, worker-agnostic function first (directly unit-testable), then wrapped by a thin worker file — this matches TRD §5's pseudocode being framework-free and keeps the heaviest-value tests fast (no worker/DOM needed to test correctness).

## 2. Milestone Plan

| Phase | Scope | Exit criteria |
|---|---|---|
| **Phase 0 — Setup** | Repo scaffold, Next.js + TS + Tailwind config, CI (lint/typecheck/test), Vercel project linked | `main` deploys a blank shell to a live Vercel URL; CI runs on PRs |
| **Phase 1 — Shared Shell & Design System** | Header/Footer/ToolSwitcher, shared component library (Button, Textarea, Toast, CopyButton, Counter, EmptyState, SkeletonBlock), Tailwind design tokens | Suite home renders with nav to 3 (stubbed) tool routes; components have Storybook or equivalent visual check + component tests |
| **Phase 2 — Tool 1: Keyword Match Type** | Full tool per PRD §5.1 / TRD §5.1 / UX-DESIGN §3.1 | Meets Definition of Done (§4 below) |
| **Phase 3 — Tool 2: Keyword Merge & Match** | Full tool per PRD §5.2 / TRD §5.2 / UX-DESIGN §3.2 | Meets Definition of Done |
| **Phase 4 — Tool 3: Negative Keyword Finder** | Full tool per PRD §5.3 / TRD §5.3 / UX-DESIGN §3.3, incl. file parsing | Meets Definition of Done |
| **Phase 5 — Polish, QA, Launch** | Cross-tool flow prompts (APP-FLOW §2), SEO content pass, accessibility audit, perf audit against 10k-line fixtures, analytics wired, launch | All tools live at production URLs, Core Web Vitals targets met (TRD §7/PRD §4), axe-core scan clean |

Tools are built sequentially (2 → 3 → 4) rather than in parallel because Tool 1's output-block pattern and match-type selector are directly reused by Tools 2 and 3 — building Tool 1 first de-risks the shared component contract before it's depended on twice.

## 3. Sprint-Level Task Breakdown

Assuming ~1-week sprints; sizes are **S** (≤ 0.5 day), **M** (1–2 days), **L** (3+ days).

### Phase 0 — Setup
| Task | Size |
|---|---|
| Next.js + TS + Tailwind scaffold | S |
| ESLint/Prettier config, CI pipeline (lint, typecheck, unit tests) | M |
| Vercel project + preview deploys on PR | S |
| Base folder structure per §1 | S |

### Phase 1 — Shared Shell & Design System
| Task | Size |
|---|---|
| Design tokens (colors, spacing, type scale) in Tailwind config | M |
| `Header` / `Footer` / `ToolSwitcher` | M |
| `Button`, `Textarea` (+ line counter), `Counter` | M |
| `Toast` + `uiStore` (Zustand) wiring | M |
| `CopyButton` + clipboard lib with fallback shim | M |
| `EmptyState`, `SkeletonBlock` | S |
| `MatchTypeSelector` (multi-select mode) | M |
| Suite home page (card grid) | M |
| Component tests for the above | M |

### Phase 2 — Keyword Match Type Tool
| Task | Size |
|---|---|
| `matchType.ts` pure algorithm + unit tests (incl. edge cases from PRD §5.1) | M |
| `matchType.worker.ts` bridge | S |
| Tool page: input panel + options panel (UX-DESIGN §3.1) | M |
| Output blocks + Copy All + flagged-list panel | M |
| Limit handling (5,000-line cap) + inline error states | S |
| SEO landing copy for `/keyword-match-type/` | S |
| E2E: golden path + limit-exceeded path | M |
| Accessibility pass (labels, focus states, aria-live toasts) | S |

### Phase 3 — Keyword Merge & Match Tool
| Task | Size |
|---|---|
| `merge.ts` pure algorithm + unit tests (incl. empty-group, dedupe, cap edge cases) | M |
| `merge.worker.ts` bridge | S |
| `GroupCard` component (add/remove/reorder, drag desktop + buttons mobile) | L |
| Live predicted-count counter (debounced) | M |
| Reuse `MatchTypeSelector` + output blocks from Phase 2 | S |
| 20,000-combination cap handling + warning/blocked states | M |
| SEO landing copy for `/keyword-merge-match/` | S |
| E2E: golden path + cap-exceeded path + reorder interaction | M |

### Phase 4 — Negative Keyword Finder Tool
| Task | Size |
|---|---|
| `tokenize.ts` pure algorithm + unit tests (unigram/bigram/trigram, stopwords, filters) | L |
| `tokenize.worker.ts` bridge | S |
| CSV parsing (`lib/file-parsing/csv.ts`) | M |
| Excel parsing (`lib/file-parsing/excel.ts`, first-sheet-only) | M |
| Column detection + manual picker fallback UI | M |
| `Dropzone` component (drag-over, click-to-browse, error states) | M |
| `FrequencyTable` (virtualized, sortable) | L |
| `Chip` + selected-negatives panel (sticky desktop / bottom-sheet mobile) | M |
| Filter bar (n-gram toggles, stopwords, min length/frequency) | M |
| Export: match-type radio reuse + Copy/Download | M |
| File size/row-count limit handling | S |
| SEO landing copy for `/negative-keyword-finder/` | S |
| E2E: paste path, file-upload path, ambiguous-column path, export path | L |

### Phase 5 — Polish, QA, Launch
| Task | Size |
|---|---|
| Cross-tool suggestion prompts (APP-FLOW §2) | M |
| Full accessibility audit (axe-core across all routes) + fixes | M |
| Performance pass against 10k-line / 20k-merge / 50k-row fixtures | M |
| Analytics event wiring + payload audit (no content leakage) | M |
| Cross-browser pass (TRD §8 matrix) | M |
| Final SEO pass (meta tags, structured data if applicable, sitemap) | S |
| Launch checklist + go-live | S |

## 4. Dependencies & Risks

| Risk / Dependency | Impact | Mitigation |
|---|---|---|
| Web Worker + Next.js bundling friction (worker loader config) | Could stall Phase 1/2 if not resolved early | Spike worker setup during Phase 0/1, not deferred to Phase 2 |
| SheetJS (`xlsx`) license/bundle size for Excel parsing | Larger client bundle, or license terms to confirm for the specific `xlsx` package version used | Confirm license during Phase 4 planning; consider `exceljs` as an alternative if bundle size becomes an issue |
| Match-type selector and output-block components must generalize cleanly across all 3 tools | If Tool 1's implementation bakes in Tool-1-specific assumptions, Tools 2–3 will need rework | Explicit reuse review at the end of Phase 2 before Phase 3 starts (see code-review checkpoint below) |
| Open PRD questions (§8: Copy All formatting, v2 lead-gen trigger, analytics tool choice) unresolved | Could cause rework in Phase 1 (Copy All formatting) or Phase 5 (analytics) | Resolve before Phase 1 exit for Copy All; analytics tool choice needed before Phase 5 |
| Large-file performance (50k-row Excel parse + tokenize) | Risk of UI freeze despite worker offload if parsing itself is slow | Include a 50k-row fixture in the Phase 4 E2E/perf checks, not just unit tests |

**Recommended checkpoint:** a short code-review pass at the end of Phase 2 specifically asking "would this component design still work unmodified for Tools 2 and 3?" before Phase 3 begins — cheaper to adjust the shared contract once than to retrofit it twice.

## 5. Definition of Done (per tool)

A tool is considered done when:
- [ ] All functional requirements in its PRD §5 subsection are implemented, including every listed edge case.
- [ ] All limits (line/row/file-size/combination caps) are enforced with the blocking, explanatory UI states specified in TRD §9.
- [ ] Unit tests cover the pure algorithm function with the specific edge cases named in the PRD (e.g. already-wrapped input, case-insensitive dedupe, empty-group skipping).
- [ ] E2E test covers the golden path and at least one limit/error path.
- [ ] Axe-core scan passes with no critical/serious violations on the tool's route.
- [ ] Responsive behavior matches UX-DESIGN §5 at mobile/tablet/desktop breakpoints (manually verified in addition to automated tests).
- [ ] Core Web Vitals measured on the deployed preview meet the PRD §4 targets.
- [ ] No network request is ever made containing keyword/file content (manually verified via browser dev tools network tab as a final check, given this is a core product promise).
- [ ] SEO landing copy is in place (H1, description, at least one explanatory paragraph — not just the bare app shell).
