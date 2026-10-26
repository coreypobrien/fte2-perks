# Research log

## 2026-10-26: initial inspection

- Found the Steam installation under `C:\Program Files (x86)\Steam\steamapps\common\Aliens Fireteam Elite 2`.
- Steam app ID: `3448650`.
- Installed build observed: `26090957`.
- Content includes `.pak`, `.utoc`, and `.ucas` archives under `AFE2/Content/Paks`.
- No perk assets have been decoded or validated yet.

## Candidate tools

- CUE4Parse: https://github.com/FabianFG/CUE4Parse
- FModel: https://github.com/4sval/FModel

These are candidates, not confirmed working extractors for this build. Determine engine version, archive readability, and whether property mappings are needed before choosing an extraction approach.

## Next investigation

1. Inspect archive metadata and identify the engine version.
2. List package paths and locate perk definitions, class catalogs, localization, and grid UI assets.
3. Decode several representative perks: an ability, a modifier, and a universal perk.
4. Verify exact occupied cells, rotation rules, connections, and compatibility against the game.
5. Export a complete catalog only after sample validation succeeds.

## Planner questions

- What are the grid dimensions and any blocked or reserved cells?
- Are rotation and reflection allowed?
- How must modifiers connect to parent abilities or cores?
- Which perks are mutually exclusive, class-limited, or dependent on unlocks?
- Which numerical effects are additive, multiplicative, conditional, or capped?

Distinguish tooltip text, serialized properties, and observed behavior. Do not fill missing values with guesses.
