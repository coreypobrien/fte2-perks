# Local v0 verification — 2026-10-27

## Outcome

Working local static web application, built with Vite 8.3.5. The production `dist/` output and the Vite development server both passed the real-browser suite. No deployment was performed.

Story verified: browser loads the versioned game catalog → player selects class/abilities and prioritizes perks → a module worker searches fixed-orientation placements and compatible groups → one solved snapshot drives the grid, inclusion checks, descriptions, and omissions → local draft/named saves survive reload and are revalidated on load.

## Measured automated results

| Check | Result |
| --- | --- |
| Unit/integration cases | **35 passed, 0 failed** |
| Instrumented total line coverage | **97.98%** |
| Instrumented total branch coverage | **94.75%** |
| Instrumented total function coverage | **96.00%** |
| Core model line / branch coverage | **100% / 95.12%** |
| Solver line / branch coverage | **100% / 96.02%** |
| Storage line / branch coverage | **100% / 100%** |
| Browser scenarios against Vite production output | **13 passed** |
| Browser scenarios against Vite dev server | **13 passed** |
| Unexpected page errors, console errors, or failed requests in normal-flow browser checks | **0** |
| Catalog provenance / no-observation-input isolation | **Passed** |
| Native shape and rule recipes against audited executable | **Passed** |

Unit coverage thresholds are enforced at 95% lines, 90% branches, and 90% functions. These unit percentages cover the instrumented shared modules/helpers; they are not a claim of 100% DOM/worker-wrapper statement coverage. Browser entry/worker integration is exercised through the real-browser scenarios, with limited V8 function observations stored separately.

## Browser evidence

The suite used Chromium through the installed Microsoft Edge executable. It exercised the actual generated Vite bundle, hashed worker, catalog asset, and localStorage, not the old illustrative mockup. Layout checks ran at widths 1440, 1024, 736, 390, and 320 pixels.

1. Catalog loading, fixed slots, searchable library and keyboard operation.
2. Blank saved-build names rejected without creating a snapshot.
3. Native-rule-aware worker fitting of required and prioritized choices.
4. Stale highlights after edits, rank locks, explicit required conflicts, and restored descriptions at rank 10.
5. Named save, save copy, independent draft, keyboard reordering, removal, and reload.
6. Ability replacement compatibility and incompatible required modifiers.
7. Universal-use perks surviving class changes while class-specific requests remain visible with reasons.
8. Older game-version saves and missing perk IDs preserved and revalidated.
9. Responsive layouts with no horizontal overflow.
10. Denied/full browser storage reporting failure without a false Saved result.
11. Malformed existing storage preserved rather than overwritten.
12. Worker cancellation with no late result published.
13. Failed catalog/worker loads producing clear recovery states.

Fault-injection contexts intentionally simulate failures. The zero-unexpected-error claim applies to the normal-flow context. The test server created for production QA is closed by the runner; the user-facing Vite server is retained for local review.

Generated run artifacts:

- [Production browser report](../work/evidence/browser-report.json)
- [Unit/integration log and coverage table](../work/evidence/unit-tests.txt)
- [Desktop screenshot](../work/evidence/desktop.png)
- [Mobile screenshot](../work/evidence/mobile.png)
- [Source manifest](../work/evidence/source-manifest.json)

These artifacts are local test outputs under ignored `work/`. The chat handoff includes accessible copies; future agents should regenerate them after code changes.

## Build and data evidence

Vite emits static HTML, hashed JavaScript/CSS, a bundled worker, and a 457KB JSON catalog (about 33KB gzip). The browser entry bundle is about 17KB before gzip. No application backend, runtime remote API, external CDN, login, or cloud-save service is needed.

The game catalog covers build 26090957. All 509 footprints are game-derived: 483 explicit masks plus 26 native constructor defaults. Native Type/restriction defaults, alternative classes, effective tags, hierarchical matching, orthogonal groups, unique group membership, and per-group override exclusions have executable-backed provenance. User observations are tests, never production overrides.

## Practical limits

Results are optimal within the implemented audited rule model when the search completes. A timeout is labeled Best found / search limit and never certifies optimality or impossibility. Full acquisition/catalog ownership membership and every runtime replacement/merge edge case are not certified by direct in-game instrumentation. All perks are assumed unlocked in v0; there is no combat-power scoring or automatic filler selection.

See `architecture.md`, `testing.md`, `native-chip-rules.md`, and root `AGENTS.md` for reproduction and future-agent guidance.
