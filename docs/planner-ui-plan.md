# Current UI behavior and design decisions

This document records the implemented v0 contract. The early concept remains in mockups/perk-planner-concept.html for historical reference. Current modules, solver details and persistence are in architecture.md. The app is unofficial, AI-assisted and unsupported; see known-limitations.md.

## Setup and discovery

The static browser workspace supports six classes. Rank defaults to 10 and controls the actual 10×6 board's unlocked cells. Primary, secondary and passive abilities occupy fixed slots, with class-appropriate replacements. Orientations are fixed; no rotated placements are generated.

The library searches names/descriptions and filters by granting class, independent Core/Modifier checkboxes, universal use and unavailable entries. Unlock origin is separate from equip eligibility. Known selected-class ordinary-perk grants obey its rank; other-class and unknown/shared acquisition are assumed available. Show unavailable reveals disabled entries with reasons. Expanding a description survives adding/removing requests and revisiting filters.

## Priorities and search

Requests stay in strict priority order, using drag-and-drop or keyboard-operable arrows. Required is a hard inclusion constraint; lower optional requests cannot collectively replace a feasible higher request. No unrequested filler is added. A requested lower-priority core or bridge can enable a higher or required modifier.

Multi-host modifiers default to Either/Any. Attach to can require one exact Core. Each modifier belongs to a single group, including through compatible chains. Solved priority rows and tile/effect tooltips name the assigned host. An old host choice is retained and labeled unavailable after an ability/class change until the user changes it.

Find arrangement appears above and below the list. It runs in a worker with a 60-second wall budget, spinner, elapsed time and Cancel. Clear priorities cancels work, empties the draft list and displayed result/effects/omissions, and preserves class/rank/abilities and named saves. Empty build-name fields stay blank unless the user types or loads a name.

## Results and descriptions

Grid tiles, inclusion checks, equipped effects and omissions use one solved input snapshot. Editing inputs marks the previous snapshot out of date. Worker job IDs prevent late cancelled results from replacing current work.

Effects you get contains descriptions from included requested perks only, excluding fixed abilities/passive. Conditional text remains conditional; no combined combat arithmetic is invented. Below the line contains every omitted request, its description and a supported reason. Unknown IDs get an explicit missing-description fallback. Hover or keyboard focus links each row, tile and description using stable IDs.

Optimal fit means proven best within the implemented rule model and stated preferences. Time-limited results are best found, not proofs of impossibility or optimality. Required failures are explicit; required requests are never silently dropped.

## Saving and transfer

Draft autosave is separate from cloned named snapshots. Saves preserve class, rank, abilities, all requested IDs in order, Required flags and optional host constraints. Malformed/future data is preserved rather than overwritten, and unknown IDs remain visible. A saved result is never authoritative after import; inputs are revalidated and solved again.

Clipboard and JSON file controls use the independent portable format in build-transfer.md, with manual JSON fallback when clipboard access fails. Import replaces the draft and leaves named snapshots untouched. Browser storage is profile/origin-bound and has no cloud synchronization; export to move builds or keep backups.

## Deferred scope

Combat-strength scoring, automatic perk recommendations, weapon optimization, account-wide ownership tracking, accounts/cloud saves, manual placement/pinning, and rotations are outside v0. Full runtime parity for every game asset/replacement remains under investigation. See native-chip-rules.md for what is audited and known-limitations.md for the remaining scope.
