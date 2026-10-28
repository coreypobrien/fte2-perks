# In-game verification log

These independent user observations are regression expectations. Production data comes from game assets and audited native defaults, never these fixtures. See [current data pipeline](perk-data.md).

## Confirmed 2026-10-26

User observations are stored by stable asset identifier in `data/verified/perks.json`. They supplement the extracted properties; raw data is unchanged.

| Perk | Verified footprint | Connection rule | Other confirmation |
| --- | --- | --- | --- |
| Doctor's Orders | 2 wide x 2 tall | No connection required | Shape omitted from export |
| Concentrated Formula | 2 wide x 2 tall | Only connects to Trauma Station | Variant-specific behavior was not separately established |
| CQW Weapon Training | 2 wide x 2 tall | No connection required | Shape omitted from export |
| Stack 'Em Up | 4 wide x 1 tall | Not checked | Confirms the footprint despite mask `[1,1,1,4]` |
| Resiliency | 10 wide x 1 tall | Not checked | User also confirms temporary health lasts 300% longer |

At the asset-only stage these observations raised known-footprint coverage from 483 to 486. Native constructor analysis subsequently resolved all 26 omitted shapes as 2x2, giving 509 game-derived footprints. The earlier 23-shape gap is closed. Packaged coverage does not prove every definition is currently selectable.

## Orientation assumption

The user subsequently authorized assuming no rotation. The planner uses declared orientations only. This is an explicit product assumption, not proof from a complete runtime audit.

## Confirmed board evidence

`-1` means unusable; other board-mask values specify the unlock rank. This confirmation does not establish the semantics of individual perk-mask integers.

## Follow-up and remaining checks

Native analysis supports orthogonal compatible modifier chains and exactly one Core group per Modifier. Concentrated Formula is evaluated against the selected ability's tags; the native-derived model accepts Trauma/Poison Station variants, not Buffing Station. The original observation did not separately verify those variants in game.

Further in-game checks should compare replacement/group edge cases and actual effects against the implemented model. See [native rules](native-chip-rules.md) and [known limitations](known-limitations.md). The missing-shape and native-default questions are resolved.

## Native-code follow-up

The 23 unresolved footprints above were a temporary limitation of the asset-only export. The native ModChipDef constructor has now been decoded and supplies a 2x2 default for all 26 omitted shapes. All 509 effective footprints come from game files; these observations are test expectations only. No manual overrides are consumed by `scripts/build-catalog.mjs`. See `native-defaults.md`.
