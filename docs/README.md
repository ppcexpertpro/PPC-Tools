# PPC Keyword Utilities Suite — Spec Docs

A free, client-side-only web suite of PPC keyword tools: **Keyword Match Type**, **Keyword Merge & Match**, and **Negative Keyword Finder**, rebuilt for modern, mobile-responsive use (modeled on dgency.com's tools for behavior parity, not cloned design/copy). Built as a shared-shell app so future tools (Convert Case, UTM Builder) drop in as new routes.

This folder is the full pre-build spec package — read in the order below, or jump straight to the doc for your role.

| Doc | For | What it covers |
|---|---|---|
| [PRD.md](PRD.md) | Product / anyone new to the project | Problem statement, personas, goals & non-goals, per-tool functional requirements, user stories, v1/v2 split |
| [TRD.md](TRD.md) | Engineers | Tech stack, architecture, data flow, core algorithms (pseudocode), performance/accessibility/testing requirements |
| [UX-DESIGN.md](UX-DESIGN.md) | Design / frontend engineers | Site map, design principles, per-tool wireframe descriptions, shared component inventory, responsive & interaction details |
| [APP-FLOW.md](APP-FLOW.md) | Engineers / QA | Step-by-step user flow per tool, cross-tool flows, the shared client-side processing pipeline |
| [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md) | Engineering lead / delivery | Repo structure, phased milestones, sprint task breakdown with estimates, risks, definition of done |

**Suggested read order:** PRD → TRD → UX-DESIGN → APP-FLOW → IMPLEMENTATION-PLAN.

**Core product promise across every doc:** all keyword/file processing happens entirely client-side — no keyword data or uploaded file content is ever sent to a server. This constraint shapes the tech stack (TRD §1), the architecture (TRD §2), and is a literal checklist item in each tool's Definition of Done (IMPLEMENTATION-PLAN §5).

**Open items to resolve before/during build** are called out inline as **Assumption:** callouts throughout, and consolidated in [PRD.md §8](PRD.md#8-assumptions--open-questions).
