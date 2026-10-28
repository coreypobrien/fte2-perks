# Portable builds and class-rank unlocks

## What is saved

Browser named saves already preserve the complete input configuration: class, rank, primary/secondary/passive IDs, ordered requests, and every Required flag. Omitted and incompatible requests are retained. Export includes that same configuration and the visible build name. Results are recomputed, so a stale grid cannot become authoritative through import.

## Clipboard and files

Open **Import / export build** beside the save controls:

- **Copy build** writes portable JSON to the clipboard and also fills the manual JSON field.
- **Paste build** reads and validates clipboard text, then loads the draft.
- **Export file** downloads a .afe2.json file; a blank name uses the selected class/rank for the filename.
- **Import file** loads one JSON file. **Load pasted JSON** provides a manual fallback for browsers that deny clipboard access.

Import replaces the working draft and its visible name, resets the selected named-save identity, and runs the solver. Existing named snapshots are not updated; use Save build to create a new one. Malformed, foreign, unsupported-version or oversized imports leave the current draft and named saves unchanged. Clipboard read/write failures display recovery instructions. A blocked browser store remains preserved; imports can still be reviewed in memory.

## Version 1 format

```json
{
  "format": "afe2-perk-build",
  "version": 1,
  "name": "Machinist example",
  "gameVersion": "26090957",
  "config": {
    "classId": "/Game/.../Player_Technician",
    "rank": 10,
    "abilities": {
      "primary": "/Game/.../Turret",
      "secondary": "/Game/.../Bodyguard",
      "passive": "/Game/.../DualTargeting"
    },
    "requests": [
      {"id": "/Game/.../FirstPriority", "required": true},
      {"id": "/Game/.../SecondPriority", "required": false}
    ]
  }
}
```

The paths above illustrate structure; actual files use catalog asset IDs. The array order is the priority order. The format version is independent of the localStorage schema. Names may be blank and are limited to 80 characters; configurations allow at most 100 unique requests, ranks 1–10, and validated class/ability strings. File size and text length are limited to one MiB; UTF-8 BOM is accepted. Extra cached result/configuration fields are dropped; request IDs unknown to the current catalog remain explicit missing entries. A different game-data version is accepted with a revalidation notice. Reconciliation resets unavailable classes/abilities using the existing rules and preserves requests.

## Rank-aware library and requests

Known ordinary-perk unlock paths in the selected class follow the selected class rank. A perk is locked only when every recorded selected-class path has a known rank above the selection; use the earliest such rank in the reason. An available lower-rank path or an unknown-rank path prevents falsely declaring it locked. Other-class rank requirements do not limit universal perks in this build. Shared/unknown acquisition paths remain assumed unlocked. There is no account-wide ownership tracker.

Default library results hide rank-locked entries. Show unavailable exposes a disabled entry and the rank reason. Rank changes refresh the library immediately. Existing and imported requests remain in their original order; rank-locked ones receive an omission reason, and a rank-locked Required request causes an explicit failure. Fixed ability pickers retain their existing slot behavior; this change applies to ordinary requested perks.

## Validation examples

Run `node scripts/generate-validation-builds.mjs` to generate the five seeded random rank-10 Machinist lists in examples/machinist-validation. Each includes 12 Machinist grants plus 12 other eligible perks, with a compatible fixed ability for every modifier. Each minimum total footprint exceeds available cells. JSON inputs are reproducible; reference timings/incumbents can differ with machine load. The guide and solutions.json preserve reference placements and omissions with truthful timeout statuses. These are in-game validation fixtures, not production data overrides or claims that catalog acquisition has been fully certified.
