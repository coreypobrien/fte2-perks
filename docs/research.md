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

## 2026-10-26: first successful extraction

The initial inspection above is historical. Perk assets have now been decoded. See `extraction.md` for the current findings: 509 chip definitions, 483 explicit masks, six class catalogs, seven boards, and coverage/validation results.

The next step is verifying native defaults and actual grid rules before building a planner.

## 2026-10-26: user verification of five perks

User verified Doctor's Orders, Concentrated Formula, and CQW Weapon Training as 2x2; Stack 'Em Up as 4x1; and Resiliency as 10x1 with the extracted description. Connection rules are recorded only where supplied. Rotation remains a tentative observation. See `in-game-verification.md` and `data/verified/perks.json`. Combined shape coverage is 486 of 509 packaged chip definitions, with 23 unresolved.

## 2026-10-26: native constructor defaults recovered

Traced ModChipDef registration, reflected PossibleShapes member offset 0x468, and constructor initialization in the shipping executable. The constructor supplies a filled 2x2 default. The catalog now derives all 509 footprints from game assets plus compiled code (483 explicit, 26 inherited), without user overrides. User observations remain cross-checks. See `native-defaults.md`. Runtime connection and rotation rules remain separate research tasks.

## 2026-10-26: initial UI and solver plan

Added `planner-ui-plan.md`: class/rank/ability setup, perk library, required and ordered optional requests, automatic arrangement, and explainable omissions. Solver preference is lexicographic, with no automatic unrequested fillers. No rotation is now an explicit user-approved planning assumption. Native game-rule coverage remains a prerequisite for calling output legal. The accompanying in-chat concept demonstrates footprint packing only.

## 2026-10-26: static-web v0 saves, cross-class eligibility, and effect descriptions

Updated the UI plan with browser-local draft and named Save/Load, stable IDs and versioned revalidation, and explicit separation of unlock source from equip scope. Recorded raw cross-class eligibility clues in `universal-use-research.md`; no eligibility rule was inferred from missing serialized values.

The user clarified the result panel should present descriptions of abilities and bonuses from equipped items, not another perk-name list. The plan and illustrative concept now show Effects you get, In grid checks on priority rows, and Below the line omissions. A versioned fragment snapshot is under `docs/mockups/`; it is a footprint-only design demonstration, not the production application or complete game-rule solver.

Preview checks passed for source-description inclusion/exclusion, fresh versus stale highlights, rank locks, impossible required sets, named local browser Save/Load across reload, and layouts at 320, 736, and 1024 pixels.
