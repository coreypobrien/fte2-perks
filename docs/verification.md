# Local v0 verification — 2026-10-27

## Outcome

Working local static web application, built with Vite 8.3.5. The production `dist/` output and the Vite development server both passed the real-browser suite. No deployment was performed.

Story verified: browser loads the versioned game catalog → player selects class/abilities and prioritizes perks → a module worker searches fixed-orientation placements and compatible groups → one solved snapshot drives the grid, inclusion checks, descriptions, and omissions → local draft/named saves survive reload and are revalidated on load.

## Measured automated results

| Check | Result |
| --- | --- |
| Unit/integration cases | **56 passed, 0 failed** |
| Instrumented total line coverage | **98.69%** |
| Instrumented total branch coverage | **96.46%** |
| Instrumented total function coverage | **97.97%** |
| Core model line / branch coverage | **100% / 95.79%** |
| Solver line / branch coverage | **100% / 97.49%** |
| Storage line / branch coverage | **100% / 100%** |
| Portable transfer line / branch coverage | **100% / 100%** |
| Browser scenarios against Vite production output | **23 passed** |
| Browser scenarios against Vite dev server | **23 passed** |
| Unexpected page errors, console errors, or failed requests in normal-flow browser checks | **0** |
| Catalog provenance / no-observation-input isolation | **Passed** |
| Native shape and rule recipes against audited executable | **Passed** |

Unit coverage thresholds are enforced at 95% lines, 90% branches, and 90% functions. These unit percentages cover the instrumented shared modules/helpers; they are not a claim of 100% DOM/worker-wrapper statement coverage. Browser entry/worker integration is exercised through the real-browser scenarios, with limited V8 function observations stored separately.

## Browser evidence

The suite used Chromium through the installed Microsoft Edge executable. It exercised the actual generated Vite bundle, hashed worker, catalog asset, and localStorage, not the old illustrative mockup. Layout checks ran at widths 1440, 1024, 736, 390, and 320 pixels.

The latest suite also verifies granting-class and independent Core/Modifier/universal filters, preservation of expanded descriptions, native drag-and-drop reorder with draft persistence/staleness, and a full 40-request worker result. New build-name fields start blank.

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

Vite emits static HTML, hashed JavaScript/CSS, a bundled worker, and a 457KB JSON catalog (about 33KB gzip). The browser entry bundle is about 24KB before gzip. No application backend, runtime remote API, external CDN, login, or cloud-save service is needed.

The game catalog covers build 26090957. All 509 footprints are game-derived: 483 explicit masks plus 26 native constructor defaults. Native Type/restriction defaults, alternative classes, effective tags, hierarchical matching, orthogonal groups, unique group membership, and per-group override exclusions have executable-backed provenance. User observations are tests, never production overrides.

## Priority controls and effect linking

Find arrangement appears above and below the priorities with a fixed 60-second limit, no budget selector, and a visible spinner/elapsed timer. Clear priorities cancels active work, resets requested tiles/descriptions/omissions and autosaves the empty draft while preserving named snapshots. A delayed-worker browser check verified the exact posted budget, progress visibility, clear/reload behavior and busy-state cleanup.

Hovering a priority, tile, equipped effect or omission highlights its counterparts; keyboard focus provides the same association. Omitted perks show their sourced descriptions separately Below the line. Effects you get includes equipped requested perks only, excluding fixed abilities/passive. These interactions and worker error/cancel cleanup passed the production and dev browser suite.

## Rank filtering and portable builds

Known selected-class ordinary-perk unlocks now follow the selected rank, with alternate paths handled conservatively. Existing requests are preserved with rank-specific omissions. Browser tests verify rank boundaries and cross-class universal availability.

Named builds already included priority order and Required flags; this was retained and reverified. Clipboard/file transfers use the version-1 portable format, preserving all requests, flags, class, rank and ability choices. Real clipboard permissions, file chooser/download, denied clipboard/manual fallback, malformed/future/oversized file rejection, imported unknown IDs and named-save independence passed browser checks.

Five seeded rank-10 Machinist examples now use only explicit Machinist rank-10-or-below grants, with 24 optional priorities each totaling 59–70 cells against 42 free cells. The Machinist-only files passed all 56 unit/integration tests and browser scenarios importing all five and waiting for proven optimal results. Refreshed reference layouts are non-overlapping, assign each modifier to one group, and are proven optimal within the implemented model. See [example guide](../examples/machinist-validation/README.md) and [portable format](build-transfer.md).

## Agile Practices and direct group search

The native-derived model treats Agile Practices as matching either Ultimate or Tactical, with exactly one selected Core group. UI hints now explicitly say ONE of. Attach to defaults to Either/Any and can pin one exact core; the chosen host appears in priority inclusion text and tile/effect tooltips. Named saves and portable files preserve the optional request.coreId; missing selected hosts remain explicit until the user changes the choice.

Fixed-root packing now constructs legal groups directly, with exact one-host assignments, geometry/type symmetry pruning and safe reachable-capacity bounds. A position-first fallback preserves performance for movable requested cores. Independent exhaustive enumeration covers two roots, all priority orders, required flags and host choices; shared bridges and overrides retain their regressions.

All five unchanged Machinist inputs now prove optimum in approximately 26–1,313 ms locally, versus timing out at 10 seconds on the prior solver. They include 15, 15, 14, 17 and 15 requested perks respectively. Browser tests now wait for each to complete optimally under ten seconds. The full 25-case benchmark completed within its one-second per-case budget: 24 optimal and one deliberate required-overcapacity failure. These are measured samples within the audited model, not a guarantee for arbitrary builds or complete in-game parity.

## Historical timer audit

Six real-browser paired trials detected no timer slowdown (median 2.62 seconds disabled versus 2.57 enabled at identical state counts and included IDs). CPU profiling instead identified repeated compatibility/reachability work. Caching reduced the five fixed-work examples from 4.18–6.09 seconds to 0.35–1.30 seconds, about 4.5–16× faster. The UI uses a 60-second wall-time budget without the old practical node cap, and calls the counter search states to distinguish it from inner candidate checks.

Before direct group search, a full 60-second sample reached 339,072 states and retained 10 perks with a truthful timeout status. The new solver proves a 15-perk optimum for that same input in about 26 ms. Work counters explain the former low state counts, and the final geometry/group rules remain unchanged. See solver-performance.md and the machine-readable profiling evidence for details.

## Solver investigation

The 25-case, one-second comparison reduced timeouts from 15 to 3. Medic catalog-order 40 requests now solves optimally in about 42 ms; the more demanding rank-10 compatible 40-request list solves optimally in about 3.3 seconds using the longer budget. Timed-out searches retain improved valid incumbents instead of just required-only results. See [benchmarks and remaining edges](solver-performance.md).

## Practical limits

Results are optimal within the implemented audited rule model when the search completes. A timeout is labeled Best found / search limit and never certifies optimality or impossibility. Full acquisition/catalog ownership membership and every runtime replacement/merge edge case are not certified by direct in-game instrumentation. Known selected-class ordinary-perk ranks are enforced; other-class and unknown/shared unlocks remain assumed available; there is no combat-power scoring or automatic filler selection.

See `architecture.md`, `testing.md`, `native-chip-rules.md`, and root `AGENTS.md` for reproduction and future-agent guidance.
