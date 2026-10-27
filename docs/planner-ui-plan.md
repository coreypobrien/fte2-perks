# Perk planner: first UI and solver plan

Status: proposed first release, 2026-10-26.

## Goal

Let a player choose a class and abilities, select desired perks, put those perks in priority order, and generate a legal arrangement on the game's grid. The solver optimizes the player's stated preferences; it does not claim to identify the strongest combat build.

Treat perk orientation as fixed. This is an explicit user-approved planning assumption, not a claim that native rotation logic has already been decoded.

## Main screen

Use one desktop workspace with a compact setup bar and three functional regions. Favor clear labels, readable perk descriptions, and a restrained terminal-inspired visual style over reproducing the game's decorative interface.

### Setup bar

- Class picker, initially Medic for development; support the six classes when their rules are ready.
- Class rank, default 10, controlling which board cells are available.
- Primary and secondary ability pickers, constrained to the chosen class. Their replacement choices occupy the proper fixed slots; they are not rotations.
- Passive slot shown on the board, determined by the class and selected replacement rules where applicable.

Changing the setup preserves requested perks and marks affected requests as incompatible or unavailable. Never silently remove them or switch an ability to make the build fit.

### Left: perk library

- Search names and descriptions; filter by core perks, modifiers, and selected abilities.
- Default to compatible perks; allow showing unavailable perks with reasons.
- Each result shows name, a small exact footprint, dimensions, and a short effect preview.
- Add a perk to the priority list. Expand or select a result for its full description, connection requirements, and unlock information where known.
- Availability in the first release assumes all perks are owned. Label that assumption; personal unlock tracking is later scope.
- Do not expose obsolete/internal packaged assets merely because they exist in the extraction. Current catalog membership and eligibility must be resolved from game data first.

### Middle: chosen perks in priority order

- The top entry is the most important preference.
- Each row has Required, move up, move down, and remove controls. Drag-to-reorder can supplement these but must not be the only way to reorder.
- **Required** means the solver must include the perk or report failure. It does not fix the perk to a board position.
- Other entries are optional preferences in strict order. Start newly added perks as optional.
- Show the footprint and any unmet dependency next to each selected perk.
- One primary action: **Find arrangement**.
- After an input change, label the previous result **Out of date**. Keep it visible until the next solve; never present it as the result of the new inputs.

### Right: grid and result

- Render the actual 10x6 board, including unusable cells, rank-locked regions, both side ability slots, and the bottom passive slot.
- Use the game's orientation: no rotate controls and no generated rotated placements.
- Distinguish fixed abilities, selected perks, empty available cells, and locked/unusable cells. Use text or patterns as well as color.
- Click a perk in the grid or priority list to highlight its counterpart and show its full details. Highlight required connections once those rules are recovered.
- Report included requests, omitted requests, and remaining usable cells. Do not turn area usage into a build-strength score.
- Explain omitted perks below the result, in priority order. Keep the player's full request list so they can adjust and solve again.
- The first release generates arrangements; manual placement and pinning individual positions are later features.

At narrower widths, stack setup, library, priority list, and result in that order. Keep the grid's proportions and readable labels; use abbreviations plus a selection detail area when full names cannot fit. All priority controls must work with keyboard input.

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
- Ordered requested perk IDs and their Required flags.

Keep native defaults and runtime rules separate from UI state. User observations are validation fixtures, never production overrides. Unknown rules remain explicit; do not invent defaults.

### Approach

Precompute every legal fixed-orientation placement for each chip on the chosen board. Represent occupancy with a 60-bit bitset (JavaScript BigInt, or multiple integer masks). Remove placements overlapping unusable cells, locked cells, or fixed occupied slots unless game replacement rules explicitly allow them.

Use backtracking with branch-and-bound, ordered by the most constrained placements and large footprints. Enforce dependencies, mutually exclusive replacements, and connectivity during search; a geometric fit is insufficient. Optimize the ordered inclusion vector with required perks as hard constraints. Keep deterministic ordering and a time budget.

Run the solver outside the UI thread, initially in a Web Worker. Return placements, omitted requests with supported reasons, and search status (complete, cancelled, or timed out). Do not conflate a complete optimal result with the first feasible candidate.

### Data gaps before valid production results

- Footprints are already code-derived for all 509 packaged chip definitions.
- Recover native connection/tag-population logic, replacements, and class eligibility.
- Distinguish selectable catalog entries from unused/internal definitions and recover acquisition restrictions.
- Verify the effective ability-slot rules and class/rank board model.
- Apply the approved no-rotation assumption. The UI need not wait for native proof to omit rotation as requested.

## Delivery order

1. **UI skeleton:** setup bar, perk search, priority list, grid rendering, selected-perk details. Use existing game-derived data and a visibly identified development preview.
2. **Rules model:** finish the native logic needed for supported Medic builds; keep rules incomplete where evidence is missing.
3. **Exact fit solver:** required perks, fixed-orientation placement, connectivity, lexicographic optional selection, and truthful search status.
4. **Complete user flow:** stale-result handling, omission explanations, cancellation, keyboard operation, and automatic local saving of setup/priorities.
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

## Review decisions

Recommended defaults are: rank 10, all perks assumed owned, no rotation, optional-by-default requests, lexicographic priority, and explicit Find arrangement rather than a solve after every keystroke. These keep the initial behavior predictable and leave room for later comparison or recommendation features.
