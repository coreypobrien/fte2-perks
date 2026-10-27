# Extraction findings — build 26090957

Inspected on 2026-10-26. Everything below comes from the locally installed game unless marked as an inference.

## Confirmed observations

- The shipping executable contains the UTF-16 string `++UE4+Release-4.27`.
- The main IoStore TOC is version 3 with compressed, encrypted, and indexed flags. Both `.pak` indexes are also marked encrypted.
- retoc 0.1.5 successfully lists the main container and converts class assets with `--version UE4_27`. No custom mappings were needed for the selected JSON exports.
- 931 packages were converted from `/Game/Blueprints/Avocado_Classes/` with zero conversion failures.
- 523 selected packages were exported to UAssetAPI JSON with zero process failures or raw/unparsed exports.
- Of 510 packages named `Perk_*`, 509 inherit from `ModChipDef`. The remaining package inherits from `CoreProcAbility` and is excluded from the chip dataset.
- All 509 chip records contain serialized name and description text. 483 contain explicit `PossibleShapes` masks. The other 26 omit that property and inherit native defaults that have not been decoded.
- All 428 distinct chip references in the six class entitlement lists resolve to extracted records. This does not cover all acquisition paths or establish full equip eligibility.
- Seven board definitions were exported: a base board and one for each class.

## Output files

`data/extracted/perks.json` preserves explicit properties, rich-text descriptions, localization keys, masks, compatibility tags, modifier operations/magnitudes, restrictions, and asset provenance. Simplified fields are provided alongside source properties. JSON source hashes permit comparison with local raw exports.

`classes.json` records names and chip entitlement entries, including rank and `GrantedBy` fields when serialized. Missing ranks remain null; do not infer that they are unavailable or rank zero.

`boards.json` preserves raw base shape and fixed placements. `extraction-report.json` lists coverage, excluded non-chip packages, unreferenced chips, and limitations.

## Class names and catalog sizes

| Display name | Internal folder | Explicit entitlement entries |
| --- | --- | ---: |
| Specialist | Custom | 48 |
| Marauder | Demolisher | 90 |
| Duelist | Gunner | 72 |
| Hunter | Lancer | 72 |
| Medic | Medic | 77 |
| Machinist | Technician | 72 |

Entries overlap across class lists. Internal folder names alone must not determine the visible class name or current eligibility.

## Board findings

The serialized `BaseShape` is width 10, height 6, with 60 integer mask entries. Each class records primary and secondary anchors at `(column=0, row=1)` and `(9,1)`, and a passive anchor at `(3,5)`. These are raw coordinates, not normalized around free cells.

Interpreting the mask as column-major (`index = column * height + row`) yields:

```text
10 10 10 10 10 10 10 10 10 10
 0  3  3  7  7  7  7  3  3  0
 0  3  3  7  7  7  7  3  3  0
 0  0  0  0  5  5  0  0  0  0
 0  0  0  0  5  5  0  0  0  0
-1 -1 -1  0  0  0  0 -1 -1 -1
```

**User confirmed in game, 2026-10-26:** `-1` means an unusable board cell; the other numbers specify the rank at which that cell unlocks. This evidence is recorded separately in `data/verified/grid-rules.json`. The column-major coordinate interpretation remains an inference. With the fixed ability shapes (two 1x4 strips and a 4x1 passive strip), 60 total minus six blocked cells minus twelve ability cells leaves 42 cells for optional perks.

The exported perk coordinate lists use this column-major interpretation and are explicitly marked as inferred. Source masks remain authoritative observations. Rotation, reflection, modifier connectivity, and replacement behavior still need verification.

Ten chip definitions have non-binary positive mask values: for example, Stack 'Em Up uses `[1,1,1,4]`, and several 10x1 strips use `[1,2,3,4,5,6,7,8,9,10]`. Their semantics are unresolved. The normalizer preserves these integers and lists them in the report; its derived cell coordinates provisionally treat nonzero values as occupied. Validation checks integer/nonnegative values without assuming masks are binary. Do not infer that every packaged 10x1 strip is a current selectable perk.

## Current-patch spot checks

- Drive's serialized description grants 2% cooldown reduction for Specials and 5% for Elites, with half credit for assists.
- Jackpot's description distinguishes full reload/heat removal for Elites, 50% magazine or 25% heat for Specials, and every-second-kill reloads for single-shot weapons.
- Stasis Bolt has an explicit 1x4 mask and lists compatibility tags for tactical modifiers, duration, cooldown, radius, and other categories.

These are asset observations, not tests that every runtime effect matches its tooltip. Native compatibility-tag population and gameplay effects can change the effective rules.

## Reproduce

Requires Windows, PowerShell, Node.js 20+, and the installed game. Run from the repository root:

```powershell
.\scripts\Initialize-ResearchTools.ps1
.\scripts\Export-GamePerks.ps1
node scripts/validate-catalog.mjs
```

The extraction script accepts `-ArchiveKey`, `AFE2_AES_KEY`, or an ignored `work/archive-key.txt`. The validated public asset key is already saved in that local file on this checkout. It is not an account credential. Tool downloads, converted packages, raw JSON, and the local key file stay under ignored `work/`. Tools are pinned and SHA-256 verified; nothing is installed globally. Game files are opened for reading only.

The complete extraction uses build-specific scratch directories to avoid mixing patches. To normalize existing JSON manually:

```powershell
node scripts/normalize-perks.mjs work/build-26090957/class-json data/extracted 26090957
```

The short `npm run research:normalize` command uses the build recorded in `data/inventory/installed-game.json`. `npm test` validates the committed catalog without needing extraction tools or game files.

## Tool provenance and references

- [retoc source and documentation](https://github.com/trumank/retoc), MIT license. Version 0.1.5 Windows archive SHA-256: `cc036b06ad3bdcf7003690b00d82719980c374e48a95bf0654f9959148d263aa` (matched publisher checksum).
- [UAssetGUI CLI documentation](https://github.com/atenfyr/UAssetGUI#command-line-arguments), MIT license. Version 1.1.0 executable SHA-256: `b7d75c0893f1a60e565853ae638bc21f2416cd12c2d9d854e297abb87ceb3263` (matched GitHub release asset digest).
- [CUE4Parse IoStore header definitions](https://github.com/FabianFG/CUE4Parse/blob/master/CUE4Parse/UE4/IO/Objects/FIoStoreTocHeader.cs), used to interpret header metadata.
- [Firsthand community extraction notes](https://www.reddit.com/r/AliensFireteamElite/comments/1vzahm7/how_moddable_will_afe2_be/), used as a lead for the asset key and tool selection; success was checked locally.
- [Official October 22 patch notes](https://www.daybreakgames.com/press/afe2/article/afe2-102226-patchnotes), useful for comparing changed descriptions and mechanics.

## Next research tasks

1. Recover or verify native defaults for the 26 missing shapes; do not silently assume 1x1.
2. Trace common/shop/weapon/horde rewards to distinguish current selectable chips from unused assets. Class entitlements alone are incomplete.
3. Board mask rank semantics are user-confirmed. Verify coordinate indexing, rotations, and modifier connection rules with representative in-game examples.
4. Resolve effective compatibility tags, replacement relationships, and native restrictions.
5. Define a planner-ready schema only after those rules are verified. Numerical optimization requires separate confirmation of stacking and conditions.
