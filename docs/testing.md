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

`npm test` runs catalog/isolation/unit/integration checks. Coverage reported for `app/core` excludes the browser DOM entry point; browser testing is separate. `scripts/serve.mjs` CLI startup is checked through the local server/browser flow rather than a unit-only subprocess coverage claim.

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
