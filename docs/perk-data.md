# Game-data pipeline

The committed records target build 26090957. Raw observations, native-derived rules and browser-ready data are separate layers. Ordinary app builds/tests use these committed files and do not require an installed game.

| Layer | Files | Meaning |
| --- | --- | --- |
| Serialized observations | data/extracted/perks.json, classes.json, boards.json | Explicit asset properties, localization/source identifiers, entitlement paths and board data. Missing properties remain missing in this layer. |
| Native defaults/rules | data/native/mod-chip-defaults.json, mod-chip-rules.json | Hash-audited constructor values, enum defaults and consuming predicates. |
| Resolved footprints | data/perks/catalog.json | All 509 effective footprints with provenance: 483 explicit, 26 native 2×2 defaults. |
| Browser catalog | app/data/game.json | Generated names, descriptions, shapes, effective tags, restrictions, sources, classes and board data used by the app. |
| Independent observations | data/verified/ | User reports used as cross-checks, never production overrides. |

Asset IDs are stable package identifiers. Class unlock paths and equip scope are independent. OriginKit and folder names do not establish restrictions. An omitted serialized Type or RestrictionType is resolved using the audited native default, rather than treated as an unknown browser value. All 29 PerksOld records remain referenced by current entitlements; the folder name is not a removal rule.

Build the browser catalog with node scripts/build-web-data.mjs. pnpm test checks provenance, effective footprints, class coverage and regeneration without user-observation inputs. Never hand-edit generated browser data. Native extraction intentionally rejects unknown executable hashes after a patch; audit code changes before updating recipes.

Runtime build choices, priority order and request.coreId are separate from the game catalog. placement.groupCoreId is a solved assignment, not a perk definition or trusted cached input. See architecture.md and build-transfer.md.

See native-defaults.md, native-chip-rules.md and universal-use-research.md for current evidence. extraction.md and research.md retain the historical asset-only stage. Full acquisition/ownership membership and every runtime merge/replacement case remain uncertified. Game-derived content is outside the original-code MIT grant; see ../NOTICE.md.
