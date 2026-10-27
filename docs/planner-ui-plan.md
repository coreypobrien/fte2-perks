# Perk planner: first UI and solver plan

Status: proposed v0 static web app, updated 2026-10-26.

## Goal

Let a player choose a class and abilities, select desired perks, put those perks in priority order, and generate a legal arrangement on the game's grid. The solver optimizes the player's stated preferences; it does not claim to identify the strongest combat build.

Treat perk orientation as fixed. This is an explicit user-approved planning assumption, not a claim that native rotation logic has already been decoded.

## Main screen

Use a responsive browser workspace with a compact setup bar and three functional regions. Ship static HTML/CSS/JavaScript, versioned game-data JSON, and a Web Worker for solving. No backend, accounts, or desktop installation are required for v0. Extraction stays a local development/build workflow. Favor clear labels, readable perk descriptions, and a restrained terminal-inspired visual style over reproducing the game's decorative interface.

### Setup bar

- Class picker, initially Medic for development; support the six classes when their rules are ready.
- Class rank, default 10, controlling which board cells are available.
- Primary and secondary ability pickers, constrained to the chosen class. Their replacement choices occupy the proper fixed slots; they are not rotations.
- Passive slot shown on the board, determined by the class and selected replacement rules where applicable.
- Named build controls: a build-name field, **Save build**, and a **Saved builds** picker with **Load**. Draft changes autosave independently; saving a named build creates or updates an explicit snapshot.

Changing the setup preserves requested perks and marks affected requests as incompatible or unavailable. Never silently remove them or switch an ability to make the build fit.

### Left: perk library

- Search names and descriptions; filter by core perks, modifiers, and selected abilities.
- Default to compatible perks; allow showing unavailable perks with reasons.
- Each result shows name, a small exact footprint, dimensions, and a short effect preview.
- Add a perk to the priority list. Expand or select a result for its full description, connection requirements, and unlock information where known.
- Availability in the first release assumes all perks are owned. Label that assumption; personal unlock tracking is later scope.
- Include class-specific and universal-use perks that the configured class may equip. A perk's unlock/origin class is not an equip restriction. Show **Universal use** only when the game-derived eligibility rule establishes it, plus an unlock-source label in details.
- Do not expose obsolete/internal packaged assets merely because they exist in the extraction. Current catalog membership and eligibility must be resolved from game data first.

### Middle: chosen perks in priority order

- The top entry is the most important preference.
- Each row has Required, move up, move down, and remove controls. Drag-to-reorder can supplement these but must not be the only way to reorder.
- **Required** means the solver must include the perk or report failure. It does not fix the perk to a board position.
- Other entries are optional preferences in strict order. Start newly added perks as optional.
- Show the footprint and any unmet dependency next to each selected perk.
- Highlight requests included in the solved grid with a subtle background, checkmark, and **In grid** text. Mark other requests **Below the line** or the specific blocked state; do not rely on color alone. After editing, change these markers to previous-result status until the next solve.
- One primary action: **Find arrangement**.
- After an input change, label the previous result **Out of date**. Keep it visible until the next solve; never present it as the result of the new inputs.

### Right: grid and result

- Render the actual 10x6 board, including unusable cells, rank-locked regions, both side ability slots, and the bottom passive slot.
- Use the game's orientation: no rotate controls and no generated rotated placements.
- Distinguish fixed abilities, selected perks, empty available cells, and locked/unusable cells. Use text or patterns as well as color.
- Click a perk in the grid or priority list to highlight its counterpart and show its full details. Highlight required connections once those rules are recovered.
- Below the grid, show **Effects you get**: description-first statements of the abilities, bonuses, and conditional effects granted by everything equipped, including the primary ability, secondary ability, passive, and all included modifiers/core perks. Do not repeat a catalog of perk names in this panel; names already appear in the priority list and grid. Source attribution belongs in a tooltip, accessible label, or expandable detail.
- Preserve actual conditions, durations, percentages, caps, and tradeoffs from the game descriptions. Describe conditional effects as conditional, not as always-active stat bonuses. v0 displays sourced descriptions; it does not guess combined arithmetic, stack effects, or rewrite ability magnitudes without decoded rules.
- Build descriptions only from the successfully solved equipped set, deduplicated by stable ID. Omitted perks contribute no effects. Selecting an effect can highlight its source tile/priority entry without turning the panel into another perk-name list.
- Follow with a clear horizontal divider and **Below the line**: every requested perk absent from the result, preserving priority order and its Required flag. Show footprint, reason, and controls to raise priority or make a perk required without removing it from the request list.
- Use specific omission categories: does not fit with higher priorities; locked/unowned; wrong class/ability; unmet dependency; unknown rule; or missing catalog entry. Label unsolved and timed-out cases accurately instead of describing every absence as a proven fit failure.
- If a required set is impossible, retain that requirement and show the conflict. Do not disguise the required perk as an optional below-the-line omission from a successful build.
- Show an empty state such as **All requested perks included** when there is nothing below the line. Report remaining usable cells without turning area usage into a build-strength score.
- Effect descriptions, priority inclusion highlights, and the below-the-line list describe the same solved configuration as the grid. Mark all results Out of date after setup/priority changes; do not mix old tiles with newly computed descriptions or fresh-looking inclusion checks.
- The first release generates arrangements; manual placement and pinning individual positions are later features.

At narrower widths, stack setup, library, priority list, and result in that order. Keep the grid's proportions and readable labels; use abbreviations plus a selection detail area when full names cannot fit. All priority controls must work with keyboard input.

## Unlock source versus equip eligibility

Represent two independent questions:

1. **How is this perk unlocked?** Source class, required rank, weapon/reward acquisition path, and other conditions where known.
2. **Where can it be equipped?** Universal use, specific allowed classes, Specialist exceptions, ability dependencies, and other game restrictions.

Build the active library from equip eligibility, then apply ownership/progression if that feature is enabled. Never restrict a universal-use perk to its origin folder or to classes whose `ChipEntitlements` explicitly mention it. Cross-class eligibility must survive saving, loading, changing classes, and solving.

Current extraction clues include `OriginKit`, `RestrictionType`, `KitRestriction`, `AlternativeKitsAllowed`, `ChipEntitlements`, and `GrantedBy`. These are observations, not a complete eligibility algorithm. An omitted `RestrictionType` is an unresolved native default, not proof of universal use. An explicit alternative class does not automatically mean every class is allowed. Recover native predicates before presenting these as confirmed choices.

v0 retains **All perks unlocked** as its planning mode, avoiding a manual ownership checklist. It must still apply actual equip restrictions and expose universal-use perks correctly. If progression tracking is added, record all class ranks in one player profile and evaluate each unlock path independently of the active build's class rank.

## Local browser saves in v0

- Store drafts and named builds in browser `localStorage`; no login or network write is required.
- Persist class, target rank, selected ability IDs, ordered stable perk IDs, Required flags, and a build name. Save requested perks even when omitted from the result.
- Version the storage schema and include the game-data/rules version. Store coordinates as numbers if a result snapshot is cached; never serialize internal BigInt masks directly.
- A saved result is a cache, not the source of truth. On load, validate inputs against the current catalog and re-run the solver; an old layout is not automatically valid after a game update.
- Preserve unknown or removed perk IDs with a readable **Missing from current catalog** state. Do not silently drop them or map by display name.
- Autosave the working draft after meaningful changes, but keep named snapshots separate so editing a draft does not silently overwrite a named build.
- Show Saved only after storage succeeds. If storage is blocked, full, or contains malformed data, keep the current work usable and show a clear local-save error. Never clear existing saves automatically to recover.
- Browser saves belong to that browser profile and site origin; v0 does not imply cross-device synchronization. Include this concise note near saved-build controls.
- Full import/export and cloud sharing remain follow-up features; the schema should allow them later.

## Priority semantics

Use **Required + strict preference order**, rather than arbitrary numerical weights.

1. Satisfy every required perk and all game rules.
2. Among feasible builds, prefer inclusion of the highest-ranked optional perk.
3. Subject to that result, prefer the next optional perk, continuing down the list.
4. Tie-break equivalent builds deterministically; later, prefer compact layouts or useful remaining space only as a secondary placement preference.

This is lexicographic optimization. A collection of lower-ranked perks must not displace one higher-ranked perk. The UI should explain this briefly beside the list: "Higher perks take priority. Required perks are never dropped."

Do not fill spare space with unrequested perks in this release. The user should be able to account for every choice the solver makes.

## Solving and result states

| State | User experience |
| --- | --- |
| No requested perks | Show fixed class abilities and prompt the user to add perks. |
| Ready | Find arrangement is available for a supported ruleset. |
| Solving | Show elapsed progress, keep the UI responsive, allow cancellation. |
| All requests included | Show the arrangement and included list. |
| Some optional requests omitted | Show the best arrangement and explain tradeoffs without deleting requests. |
| Required set impossible | Show no successful build; identify conflicts the solver can substantiate and suggest which requirements to relax. Never silently drop a required perk. |
| Inputs changed | Mark the previous arrangement Out of date. |
| Time limit reached | Show Best found only if a valid candidate exists; do not claim optimality or impossibility. |
| Rules incomplete | Do not label a geometric packing result as a legal game build. Limit production solving to supported rules or clearly identify a separate footprint-only preview. |

Omission explanations must be accurate: "Needs rank 10," "Requires a different ability," or "Omitted to preserve higher-priority perks." Only claim that a perk cannot fit when the relevant search completed. A small leftover area alone is not proof of why a shape was omitted.

## Solver design

### Inputs

- Game build and schema version.
- Class, rank, primary/secondary/passive definitions.
- Board geometry and fixed placements, decoded from game files.
- Chip definitions, fixed footprints, replacements, compatibility, restrictions, and connectivity rules recovered from game assets and native code.
- Unlock-source records separately from equip eligibility, including universal-use and alternative-class behavior.
- Ordered requested perk IDs and their Required flags.

Keep native defaults and runtime rules separate from UI state. User observations are validation fixtures, never production overrides. Unknown rules remain explicit; do not invent defaults.

### Approach

Precompute every legal fixed-orientation placement for each chip on the chosen board. Represent occupancy with a 60-bit bitset (JavaScript BigInt, or multiple integer masks). Remove placements overlapping unusable cells, locked cells, or fixed occupied slots unless game replacement rules explicitly allow them.

Use backtracking with branch-and-bound, ordered by the most constrained placements and large footprints. Enforce dependencies, mutually exclusive replacements, and connectivity during search; a geometric fit is insufficient. Optimize the ordered inclusion vector with required perks as hard constraints. Keep deterministic ordering and a time budget.

Run the solver outside the UI thread in a Web Worker. Return placements, deduplicated equipped perk/ability IDs, omitted requests with supported reasons, an input fingerprint, and search status (complete, cancelled, or timed out). Derive the description panel, inclusion highlights, and below-the-line list from this single response, not separate heuristic filters. Do not conflate a complete optimal result with the first feasible candidate.

### Data gaps before valid production results

- Footprints are already code-derived for all 509 packaged chip definitions.
- Recover native connection/tag-population logic, replacements, and class eligibility.
- Distinguish selectable catalog entries from unused/internal definitions and recover acquisition restrictions.
- Verify the effective ability-slot rules and class/rank board model.
- Apply the approved no-rotation assumption. The UI need not wait for native proof to omit rotation as requested.

## Delivery order

1. **UI skeleton and local saves:** setup bar, perk search, priority list with In grid checks, grid rendering, Effects you get descriptions, Below the line omissions, draft autosave, and named Save/Load. Use existing game-derived data and a visibly identified development preview.
2. **Rules model:** finish native logic for supported Medic builds, including universal-use perks unlocked through other classes. Separate unlock source from equip restrictions; keep rules incomplete where evidence is missing.
3. **Exact fit solver:** required perks, fixed-orientation placement, connectivity, lexicographic optional selection, and truthful search status.
4. **Complete user flow:** stale-result handling across the grid and both result lists, omission explanations, cancellation, keyboard operation, and save-version migration/revalidation.
5. **Expand:** remaining classes and replacement combinations after their rule coverage is verified.

Explicitly defer combat-strength scoring, automatic perk recommendations, weapon optimization, accounts, sharing services, manual tile placement, placement pinning, and rotated shapes.

## Acceptance checks

- A 4x1 strip is never rotated into a 1x4 slot.
- Resiliency's 10x1 footprint can use the top row when unlocked; locked cells and side anchors prevent invalid alternatives.
- Native-default 2x2 chips match the independently supplied in-game observations.
- A required perk is never silently omitted, including when multiple requirements conflict.
- One higher-priority optional perk is retained over any number of lower-priority preferences when feasible with requirements.
- Modifier geometry alone cannot bypass its ability or connectivity rules.
- Small synthetic boards compare solver results with exhaustive enumeration, testing both feasibility and preference optimality.
- Timeout never produces a false Impossible or Optimal claim.
- Class/ability/rank changes mark prior results stale and preserve visible unmet requests.
- The complete flow works using a keyboard; labels and statuses remain understandable without color.
- A perk unlocked through one class appears for another eligible class when its game-derived rule permits universal use; origin class alone never hides it.
- A Specialist exception does not make a perk universally available to every class.
- Save and reload restores omitted requests, priority order, required flags, abilities, rank, and class; a fresh solve rebuilds the effect descriptions, inclusion highlights, and below-the-line list.
- Below-the-line entries remain editable requests, never deleted perks. Primary, secondary, and passive descriptions appear in Effects you get exactly once, alongside equipped-perk effects; the panel does not simply relist perk names.
- Included priority rows have a checkmark plus In grid text; omitted requests remain visible. Changing rank or priority never leaves stale inclusion markers looking current.
- Removing or excluding Resiliency removes its 300% temporary-health duration description from the effect panel. Conditional bonuses retain their conditions rather than becoming assumed baseline statistics.
- Blocked storage, malformed saved data, and catalog-version changes preserve recoverable user input and never produce a false Saved or Valid status.

## Review decisions

Recommended defaults are: rank 10, all perks assumed owned, no rotation, optional-by-default requests, lexicographic priority, and explicit Find arrangement rather than a solve after every keystroke. These keep the initial behavior predictable and leave room for later comparison or recommendation features.
