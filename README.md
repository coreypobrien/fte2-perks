# Aliens: Fireteam Elite 2 — static perk planner

A working local browser app for choosing required and prioritized perks, generating a fixed-orientation grid, reviewing equipped effect descriptions, and saving builds in the browser.

## Run locally

Requires **Node.js 22.14+**. Install the pinned development dependencies first:

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

Open **http://127.0.0.1:4173/**. Keep this port for the same browser saves. Stop the server with Ctrl+C in its terminal. The server binds to loopback only.

The application is under `app/`; Vite provides development/build tooling. The custom static server is retained only as a test/preview helper. Do not open index.html with file:// because module fetches and the solver worker need an HTTP origin.

## Use it

1. Choose a class, rank, and fixed-slot abilities. Medic is the default; all six class setups are available.
2. Search the game-derived perk library, filter by granting class and Core/Modifier, and toggle cross-class universal perks. Add desired perks and drag or use arrow controls to prioritize them.
3. Mark hard requirements as Required. Modifiers that match multiple cores default to Either/Any; optionally choose Attach to for a specific host. The solved row and tile identify its single chosen core. Then select Find arrangement above or below the list. Search has a fixed 60-second limit, spinner/elapsed indicator, and Cancel. Clear priorities starts over without changing your named saves.
4. Review the grid, In grid checks, equipped-perk descriptions, and Below the line descriptions of omitted perks. Fixed abilities/passive stay out of Effects you get. Hover or focus a perk to highlight its matching row, tile and description. Changing inputs marks all prior results stale.
5. Name and save a build, save a copy, or load a named snapshot. Every save preserves priority order and Required flags, including omitted perks. The working draft autosaves separately.
6. Open Import / export build to copy/paste JSON or export/import a .afe2.json file. Manual JSON controls work when clipboard access is denied. Import loads a draft without replacing named saves.

Known selected-class perk grants follow the selected rank. Other-class and unknown/shared unlocks are assumed available. Universal-use eligibility is independent of unlock origin; class restrictions and alternative classes still apply. The app arranges user choices; it does not score combat strength or add unrequested filler perks.

## Machinist validation examples

Five oversized rank-10 lists are in [examples/machinist-validation](examples/machinist-validation/README.md). Import any of the five .afe2.json files through Import file. Each contains only explicit Machinist grants unlocked by rank 10, with 24 requests covering 59–70 cells against 42 available cells. The refreshed references prove optimality within the audited model in roughly 0.03–1.3 seconds locally and name each modifier’s single core group. Regenerate with `node scripts/generate-validation-builds.mjs`.

## Static output

```powershell
node scripts/build-web-data.mjs
node scripts/build-static.mjs
node scripts/serve.mjs --directory dist --port 4174
```

`dist/` contains Vite-generated HTML, hashed JavaScript/CSS assets, a bundled worker, and the game-data JSON. It needs no backend, cloud account, secrets, or external CDN. Serve these files with any static HTTP(S) host. The generated dist directory is replaced by each build and is ignored by Git. Use `pnpm preview` to review a production build on port 4173 after stopping the dev server.

## Tests

```powershell
node scripts/validate-catalog.mjs
node scripts/test-catalog-inputs.mjs
node --test --experimental-test-coverage tests/*.test.js
```

For real-browser testing:

```powershell
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
node scripts/test-browser.mjs --directory dist
```

Use `--browser-path` for installed Edge/Chrome, `--playwright-module` for an existing Playwright installation, or `--base-url` for an existing local server. See [testing instructions](docs/testing.md), [verification evidence](docs/verification.md), and [solver performance measurements](docs/solver-performance.md).

## Game data and limits

The committed data covers build **26090957**: 509 chip definitions, all 509 code-derived footprints (483 explicit plus 26 native defaults), six class definitions, seven board definitions, and native-derived class and connection rules. Ordinary app development does not require the game installed.

Native research recovered Core/Modifier defaults, class restriction dispatch, alternative-class matching, tag auto-population and hierarchy, orthogonal connected-group rules, and per-group ability-override exclusion. The solver assigns each modifier to one Core group; a shared bridge cannot belong to two groups simultaneously.

This is an audited static translation, not complete runtime instrumentation. Full acquisition/ownership membership and all replacement/merge edge cases are not certified. No rotations is an explicit user-approved planning assumption. Results are optimal within the implemented rules and requested priorities when search completes; time-limited results never claim optimality or impossibility.

User observations under `data/verified/` are independent checks and are never production catalog overrides. Game files are read only. Tool binaries, raw exports, scratch assets, and browser evidence stay under ignored work/.

## Future agents

Start with [AGENTS.md](AGENTS.md), [architecture](docs/architecture.md), [native rule evidence](docs/native-chip-rules.md), and [the UI plan](docs/planner-ui-plan.md). The research history and native extraction reproduction are in docs/.

To refresh after a game patch, first audit changed executable code; the native extractors intentionally reject unknown hashes. Use `scripts/Initialize-ResearchTools.ps1`, `scripts/Initialize-NativeTools.ps1`, and `scripts/Export-GamePerks.ps1` for local research regeneration. Never bypass the hash guard simply to force a new patch through.
