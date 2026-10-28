# Testing and local evidence

## Requirements

Node.js 22.14+ runs development and tests. Install pinned development tools with `pnpm install --frozen-lockfile`; there are no deployed server/runtime dependencies. Browser tests use Playwright 1.62.1 (dev dependency) plus Chromium, or an explicitly selected installed Edge/Chrome executable.

## Core and integration tests

From the repository root:

```powershell
node scripts/build-web-data.mjs
node scripts/validate-catalog.mjs
node scripts/test-catalog-inputs.mjs
node --test --experimental-test-coverage tests/*.test.js
```

`pnpm test` runs catalog/isolation/unit/integration checks. Coverage reported for `app/core` excludes the browser DOM entry point; browser testing is separate. `scripts/serve.mjs` CLI startup is checked through the local server/browser flow rather than a unit-only subprocess coverage claim.

## Browser tests

```powershell
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
node scripts/build-web-data.mjs
node scripts/build-static.mjs
node scripts/test-browser.mjs --directory dist
```

For an existing browser executable:

```powershell
node scripts/test-browser.mjs --directory dist --browser-path 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
```

If Playwright is supplied outside node_modules, pass `--playwright-module` pointing to its `index.mjs`. If a server is already running, pass `--base-url http://127.0.0.1:4173/`. Otherwise the runner starts an ephemeral static server and closes it in `finally`.

Outputs under `work/evidence/`:

- `browser-report.json`: actual scenario outcomes, console errors, failed requests, and a limited V8 function-coverage metric for the browser entry point.
- `desktop.png`, `mobile.png`: actual rendered browser screenshots.
- Unit/catalog log files can be captured there by the invoking verification command.

Fault-injection tests run in isolated browser contexts. Expected failed catalog/worker responses and denied storage are deliberately created in those contexts; normal user-flow assertions require no unexpected page/console errors or failed requests.

## Important regressions to retain

- Four-wide perks cannot rotate to fit a tall one-column space.
- Required perks are not silently dropped; lower-priority connectors may still enable required modifiers.
- Lexicographic preference is independently checked against tiny-board exhaustive search.
- Shared bridges get one Core group, never two simultaneous memberships.
- Overrides are excluded per group, not globally.
- Concentrated Formula uses the selected primary core's compatibility; it is not accepted by Buffing Station merely because Advanced Trauma Station accepted it.
- Universal-use perks are not hidden by their acquisition class.
- Old-folder paths cannot be treated as obsolete when current entitlements still reference them.
- Omitted perks' descriptions do not leak into the effects panel.
- Editing inputs invalidates the grid, descriptions, and inclusion checks together.
- Malformed/future saves remain untouched, and a failed localStorage write never displays Saved.
- Budget limits/cancellation never display a false optimum or impossibility claim.

## Solver performance regressions

Run `node scripts/benchmark-solver.mjs` for 25 deterministic cases across all six classes, rank 5/10 compatible Medic lists, oversubscription, fragmentation, and impossible requirements. Output is `work/evidence/solver-benchmarks.json`. Use `--budget-ms 10000 --only Medic-connected` for the longer search cases; output then has a budget suffix. `--baseline work/solver-before.mjs` optionally compares an older solver module. See solver-performance.md for baseline reproduction and measured limits.

Retain deterministic node-bound game-data regressions, timeout incumbent checks, fixed-modifier/sparse-footprint checks, and the independent mixed geometry/group-assignment oracle. Browser tests also cover granting/type/universal filters, expansion preservation, blank initial name, real drag-and-drop persistence/staleness, and a real 40-request worker flow.

## Rank filters and portable builds

Unit tests cover selected-class rank boundaries, alternate and unknown unlock paths, cross-class availability, portable schema/version/size validation, full priority/Required round trips, unknown IDs, and safe filenames. The browser suite uses actual clipboard permissions and a real file chooser/download, verifies named snapshots remain independent, and tests clipboard-denial fallback and malformed/future input recovery. Five checked-in Machinist examples are independently checked for class eligibility, sufficient excess area, fixed-ability compatibility, non-overlap and valid groups in their recorded reference layouts. See docs/build-transfer.md and examples/machinist-validation/README.md.

## Priority controls, progress and linked effects

Browser tests verify linked hover from every row/tile/effect/omission surface plus keyboard focus, descriptions for omitted perks, and fixed-ability exclusion. A delayed real worker exposes the spinner/elapsed indicator and records posted options to verify the fixed 60-second budget. Tests exercise both solve buttons, clearing during search, persisted empty drafts, preserved named snapshots, and progress cleanup on completion/cancel/error. The pure effect model separately verifies that fixed ability IDs and unknown entries cannot leak into the equipped-perk description list.

Machinist example validation also directly checks that every requested ID has an explicit Machinist unlock-source entry at rank 10 or below with no extra grant condition. Origin folder and universal equip eligibility do not qualify a perk for these examples. Fixed slots use Machinist defaults or known Machinist replacement grants.

## Timer and solver profiling

`node scripts/profile-solver-ui.mjs --browser-path PATH --output work/evidence/timer-profile.json` alternates the actual UI timer on/off in six fresh browser contexts using the same 4,000-node worker budget and verifies identical included IDs/search states. `node scripts/profile-solver.mjs --baseline work/solver-before-60.mjs --long-case 1` compares all five Machinist files at identical node budgets, then runs one case for 60 seconds without the old UI node cap. Materialize the baseline with `git show 3cbe84a:app/core/solver.js | Set-Content work/solver-before-60.mjs`. CPU profiles can be captured with Node --cpu-prof. Keep benchmarks sequential when comparing elapsed time; correctness/browser checks may run separately. See solver-performance.md for measured results and limitations.
