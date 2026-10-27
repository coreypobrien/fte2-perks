# Aliens: Fireteam Elite 2 — perk research and planner

Gather reproducible information from a local game installation, then build a perk-grid planner using verified data.

## Current findings

Build **26090957** has been decoded into a first research dataset:

- **509 chip definitions** with names and descriptions.
- **509 code-derived footprints**: 483 explicit asset masks and 26 native constructor defaults.
- Six class catalogs with **428 distinct referenced chips**, all resolved.
- Seven board definitions, including a **10x6 base board** and fixed ability placements.

Footprints combine serialized asset observations with the compiled native class default. Eligibility, other native defaults, rotation, connectivity, and runtime stacking are still being researched. No planner has been implemented yet.

Start with [native default recovery](docs/native-defaults.md) and [the extraction findings](docs/extraction.md) for evidence, limitations, reproducible commands, and next tasks.

## Validate the dataset

Requires Node.js 20+; no npm packages need to be installed:

```powershell
node scripts/validate-catalog.mjs
# or: npm test
```

## Extract from the installed game

Requires Windows, PowerShell, Node.js, Python, and the game:

```powershell
.\scripts\Initialize-ResearchTools.ps1
.\scripts\Initialize-NativeTools.ps1 -PythonPath 'PATH_TO_PYTHON_EXE'
.\scripts\Export-GamePerks.ps1
```

Tools are pinned, checksum-verified, and stored under ignored `work/tools/`. The asset key can be supplied through `-ArchiveKey`, `AFE2_AES_KEY`, or ignored `work/archive-key.txt` (already present on this checkout). Extraction reads the game and writes only to this repository.

For metadata only, run `.\scripts\Get-GameInventory.ps1`. Use `-SteamAppsPath` for a different Steam library.

## Layout

- `docs/`: research findings, open questions, and data design notes.
- `data/inventory/`: installation and archive metadata.
- `data/extracted/`: normalized chip, class, board, and coverage JSON.
- `data/perks/catalog.json`: effective footprints built from game files only; runtime rules remain incomplete.
- `data/native/`: defaults recovered from the hash-verified shipping executable.
- `data/verified/`: independent in-game observations used as validation checks, never catalog inputs.
- `scripts/`: installation, extraction, normalization, and validation helpers.
- `work/`: ignored tools, package listings, raw exports, and scratch data.

## Milestones

1. Identify installed build and archive formats — complete.
2. Decode perk descriptions, shapes, and catalog references — initial dataset complete.
3. Recover shape defaults from native code — complete for the installed build; trace remaining runtime rules next.
4. Build a grid editor with compatibility validation and saved builds.
5. Add automatic placement for a selected set of perks.

Game archives, bulk raw exports, and tool binaries are excluded from Git. Preserve provenance and uncertainty for every field.

## UI and solver plan

See [the proposed first-release UI and solver plan](docs/planner-ui-plan.md). The first goal is required and prioritized perk selection followed by automatic placement, using fixed orientations and explicit results when requests cannot all fit.
