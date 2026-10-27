# In-game verification log

## Confirmed 2026-10-26

User observations are stored by stable asset identifier in `data/verified/perks.json`. They supplement the extracted properties; raw data is unchanged.

| Perk | Verified footprint | Connection rule | Other confirmation |
| --- | --- | --- | --- |
| Doctor's Orders | 2 wide x 2 tall | No connection required | Shape omitted from export |
| Concentrated Formula | 2 wide x 2 tall | Only connects to Trauma Station | Variant-specific behavior was not separately established |
| CQW Weapon Training | 2 wide x 2 tall | No connection required | Shape omitted from export |
| Stack 'Em Up | 4 wide x 1 tall | Not checked | Confirms the footprint despite mask `[1,1,1,4]` |
| Resiliency | 10 wide x 1 tall | Not checked | User also confirms temporary health lasts 300% longer |

Three previously missing footprints are now known. Combining 483 explicit asset shapes with three user-verified shapes gives **486 chips with known footprints**, leaving **23 unresolved**. This is a coverage count, not proof that all 509 packaged definitions are currently selectable.

## Tentative rotation observation

The user said, "I don't think any of them rotate." This is recorded as tentative in `data/verified/grid-rules.json`, not promoted to a confirmed global rule. Do not generate rotated orientations as though they were verified legal placements.

## Confirmed board evidence

`-1` means unusable; other board-mask values specify the unlock rank. This confirmation does not establish the semantics of individual perk-mask integers.

## Remaining questions

- Are orientations fixed for every selectable perk?
- What are the footprints of the remaining 23 chips that omit `PossibleShapes`?
- Do modifiers require direct adjacency to their ability, or can they connect through compatible modifier chains?
- Which Trauma Station variants accept Concentrated Formula? The current evidence names Trauma Station but does not identify variants separately.

All three checked missing-shape chips are 2x2. A shared native 2x2 default is a useful hypothesis; do not apply it to the other 23 without further evidence.

## Native-code follow-up

The 23 unresolved footprints above were a temporary limitation of the asset-only export. The native ModChipDef constructor has now been decoded and supplies a 2x2 default for all 26 omitted shapes. All 509 effective footprints come from game files; these observations are test expectations only. No manual overrides are consumed by `scripts/build-catalog.mjs`. See `native-defaults.md`.
