# Native defaults: recovering values omitted from asset exports

## Result

All **509 packaged chip footprints** are now recoverable from the installed game: 483 are explicitly serialized, and 26 inherit the native `ModChipDef` 2x2 default. No per-perk manual overrides are used to build `data/perks/catalog.json`.

User observations in `data/verified/perks.json` are independent checks, not catalog inputs. The three 2x2 observations agree with the native constructor result.

## Why the initial export was incomplete

Unreal assets can omit properties unchanged from their constructor defaults. The first exporter inspected serialized Blueprint class-default properties, but did not resolve defaults established in the shipping executable. Missing `PossibleShapes` therefore meant **not serialized here**, not **unavailable from the game**.

[Epic's object serialization documentation](https://dev.epicgames.com/documentation/unreal-engine/unreal-object-handling?application_version=4.27) explains that unchanged post-constructor defaults can be omitted.

The generated catalog now resolves `PossibleShapes` from the asset when present and the native class constructor otherwise. Other properties are not automatically assigned guessed defaults.

## Evidence from build 26090957

Executable SHA-256: `3493d7ce83c4c9dcd45d2466c1c02c2d4e69bf20ffb862ef3380ee8c96cfb93c`.

Addresses below are RVAs relative to the executable image base. They are an audited recipe for this exact executable, not stable addresses across patches.

1. `ModChipDef` class registration at RVA `0x21c05f0` registers constructor wrapper `0x21c0a70`, which branches to constructor `0x21c0fb0`.
2. The reflected `PossibleShapes` property descriptor at `0x58d5c18` identifies member offset `0x468`.
3. Constructor instruction `0x21c1224` selects that member: `lea r12, [rbx + 0x468]`.
4. Instructions `0x21c131e` and `0x21c1326` write width and height immediates to a temporary shape; both decode as 2.
5. The constructor allocates four integer entries, zeros them, then fills the origin and its three neighboring cells with 1. It uses height as the column stride, supporting column-major indexing.
6. The temporary shape is appended to `PossibleShapes`; width and height are copied into offsets `0x10` and `0x14` of the shape element at `0x21c142e` and `0x21c1432`.

`scripts/extract-native-defaults.py` verifies the executable and constructor hashes, checks the reflected property offset and decoded instructions, and reads the dimensions and mask values from those instructions. It refuses unknown builds. The algorithm is deliberately scoped to this audited constructor pattern; it is not a general C++ decompiler.

`data/native/mod-chip-defaults.json` records the extracted values and instruction provenance. `scripts/build-catalog.mjs` consumes that file and the raw asset observations. It does not read `data/verified/`.

## Reproduce

Requires Python plus the locally installed pinned packages in `scripts/native-requirements.txt`:

```powershell
python -m pip install --target work/tools/python-packages -r scripts/native-requirements.txt
python scripts/extract-native-defaults.py
node scripts/build-catalog.mjs
node scripts/validate-catalog.mjs
```

`scripts/inspect-native.py` provides read-only PE string-reference lookup and bounded disassembly for additional research. All analysis reads executable bytes from disk; it does not modify or inject into the game.

## Remaining scope

All 509 **footprints** are resolved. This does not establish that all packaged definitions are currently selectable, or recover every runtime rule. Native tag population, connections, replacement behavior, rotation, restrictions, acquisition paths, and numerical stacking must still be traced. Preserve unresolved rules explicitly instead of replacing them with user-entered production overrides.
