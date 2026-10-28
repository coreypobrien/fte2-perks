# Architecture and maintenance

## Runtime

The production app is static HTML, CSS, and ES modules under `app/`. `node scripts/build-static.mjs` invokes Vite to bundle it to `dist/`. Vite provides the development server and CSS updates, hashed production assets, a bundled module worker, and relative base paths. `vite.config.js` is the central build/server configuration; `pnpm-lock.yaml` pins dependency resolution. The browser downloads one approximately 450KB versioned catalog, renders local controls, and sends a serializable problem to a module Web Worker. No API endpoint or remote computation is involved.

`scripts/serve.mjs` is a loopback-only development/test file server, not a production application backend. Any static HTTP(S) host can serve `dist/`. Opening `index.html` using `file://` is unsupported because module fetches and workers require a served origin.

## Modules

| File | Responsibility |
| --- | --- |
| `app/main.js` | DOM UI, one current input configuration, a separate solved snapshot, worker job IDs/cancellation, named saves and stale states. |
| `app/core/model.js` | Native-derived class eligibility, ability-slot options, configuration reconciliation, problem assembly, and sourced effect descriptions. |
| `app/core/solver.js` | Pure fixed-orientation packing, required constraints, lexicographic optional choices, unique connected group assignment, and truthful budget statuses. |
| `app/core/transfer.js` | Validated versioned portable build JSON, priority/Required preservation, safe download filenames. |
| `app/core/storage.js` | Versioned localStorage serialization, validation, defensive loading, independent draft and named snapshots. |
| `app/worker.js` | Runs the pure solver away from the UI thread and returns errors as structured responses. |
| `scripts/build-web-data.mjs` | Joins serialized properties, resolved shapes, native enum defaults/rules, class definitions, and board metadata. |

## Solver behavior

Every declared shape is used in its declared orientation; the solver generates no rotations. The board mask is column-major (`x * height + y`), while occupancy bits use row-major (`y * width + x`) internally. Negative board entries are unusable; other entries are unlock ranks.

Fixed abilities occupy their selected slots first. Candidate placements are precomputed against unlocked cells and fixed occupancy. Include-first optional branching preserves strict lexicographic order, with required requests always present. Each partial subset is packed immediately to improve the valid incumbent before exploring longer lists. The incumbent comparison uses inclusion order, never perk count. Search prunes area overflow, unavailable footprints, and missing roots only when no selected or undecided requested Core can supply them.

The packing search chooses an exact strategy from the requested roots. When every modifier's possible root is fixed on the board, it constructs groups directly: a modifier is added only when it touches an already rooted compatible group, and chooses exactly one group. Fixed modifiers participate at their fixed positions. Standalone requested cores are packed into the remaining geometry after modifier groups. Any legal final group has a root-first growth order; the search branches across every available frontier modifier/position/group rather than forcing one modifier to attach prematurely.

Equivalent geometry/allowed-host/override types need only one identity order within a selected subset. Failed group states key on remaining piece IDs, occupied cells, group cell unions and override flags. Whole chip identity inside an already connected group cannot change a future attachment. Loose-core geometry failures have a separate occupancy cache. Completed failed states remain valid across a switch from priority-first ordering to a constrained ordering after a 10,000-state trial; incomplete paths are never cached as failures.

For rectangular footprints, conservative future reachability gives a capacity upper bound for each union of groups. Chips confined to that group union cannot require more cells than its reachable free area. Future candidates are allowed to overlap in this bound, so it overestimates capacity. For up to eight groups all nonempty unions are checked; larger group sets use singleton/whole-set bounds. Sparse shapes bypass these cell-flood bounds and use exact chip adjacency. Group-growth failure is never treated as geometric impossibility: additional requested cores/bridges may rescue a superset.

When selected movable cores can host modifiers, a position-first exact fallback retains its constrained placement ordering, semantic occupancy memo and conservative partial reachability checks. Its final assignGroups validator returns a concrete single-host mapping rather than just a Boolean. This portfolio avoids the regressions caused by forcing movable roots into place before large fixed-root modifiers. Both strategies use precomputed compatibility and fixed masks, fixed orientations and the same per-group override rule. Memo tables retain at most 50,000 entries each; dropping memo entries affects speed only.

The required-only arrangement is an incumbent, never an infeasibility proof. A timeout returns the best valid arrangement found so far, including improvements made at partial subsets. Some crowded arrangements still need the longer budget; benchmarks are documented in solver-performance.md.

Final connectivity assigns each Modifier to exactly one compatible Core group. It permits orthogonal chains whose members all match the same root Core. Independent reachability is only pruning, since a shared bridge cannot serve two different groups at once. Per-group GrantedAbilityOverride exclusions apply. A memoized assignment search handles ambiguous groups in the fallback; a single-core shortcut uses connectivity plus the override count. Every solved requested Modifier carries groupCoreId, and the validator respects a supplied groupCoreId when checking that chosen assignment.

The pure solver supports elapsed-time and configurable node limits. The UI uses the wall-time limit; small explicit node caps remain useful for reproducible profiling/tests. The displayed counter now says search states: it counts recursive choice/placement and exact-group traversal, not every placement attempt or inner operation. Result work counters separately report candidate checks, reachability checks and flood iterations. `optimal` means the inclusion vector is proven optimal within this model. `timeout` may contain a valid incumbent but never claims optimality or impossibility. `infeasible` follows completed search or a definitive required-unavailability check. `invalid` is an input error. Cancellation terminates the owned worker; job IDs reject stale messages.

The UI always uses a 60,000 ms budget with maxNodes set to Number.MAX_SAFE_INTEGER so the old node cap cannot stop a run early. Find arrangement is available above and below priorities. A shared spinner and elapsed timer indicate active work without implying a percentage; reduced-motion styling is supported. Completion, cancellation, input edits, clear, and worker errors terminate the interval and clear busy state. Active search takes precedence over stale-result badges.

## Eligibility and catalog scope

Native Type defaults to Core; native RestrictionType defaults to None. None bypasses the class restriction check. Kit uses the selected class (or subclass) against KitRestriction OR explicit AlternativeKitsAllowed. OriginKit remains acquisition metadata. There are no explicit Role restrictions in this catalog; that unsupported case fails closed.

The browser catalog preserves all 509 packaged chip definitions, 6 class boards, and fixed ability alternatives. Ability-slot entries appear in pickers rather than as ordinary requests. All 29 PerksOld records are retained because current entitlements reference them. Shared generic/weapon/reward acquisition membership remains incompletely traced; known grants in the selected class now follow its rank; other-class and unknown/shared unlock paths remain assumed available.

This is static native-code translation plus asset extraction, not direct runtime instrumentation. Replacement shape and group-merge edge cases, full acquisition/ownership progression, combat stacking arithmetic, and automated runtime parity remain research limits. Do not claim that every possible in-game case is certified.

## Library and priority interactions

Granting class uses known unlock-source class names, falling back to OriginKit only when no unlock source is recorded. It is a discovery filter, never an equip restriction. Core and Modifier checkboxes are independent. Show universal is checked initially; disabling it hides universal-use perks from other classes and shared progression while retaining known selected-class grants. Granting class still narrows results when Show universal is enabled. Show unavailable independently exposes disabled class-ineligible entries. Filter state is transient. Known ordinary-perk selected-class unlock sources are hidden below their earliest rank unless Show unavailable is checked, which exposes a disabled row with its rank reason. Changing rank refreshes the library immediately. Saved/imported future-rank requests remain visible in priorities and become solver omissions (or required failures), never silently deleted. A perk with no selected-class grant is not locked by another class’s rank. An unknown-rank selected-class path prevents assuming a lock. Fixed ability pickers retain their existing slot-option rules.

Expanded library descriptions are tracked by stable perk ID and survive adding/removing requests and filtering away/back. Priorities support native drag-and-drop plus keyboard-operable arrow buttons. Both reorder paths use the same stale-result and draft-save flow. New sessions start with an empty build-name field; loading a named snapshot fills its explicit name.

Clear priorities cancels any worker, empties draft requests, removes requested grid tiles and all effects/omissions immediately, clears selection/highlights, and autosaves. It preserves class/rank/ability choices and existing named snapshots.

Equipped effects derive only from included requested IDs, excluding slot abilities/passive even if an invalid request repeats a slot ID. Below the line separately displays each omitted description and reason; unknown IDs get an explicit unavailable-description fallback. Both sections use the same solved snapshot, with stale labels after edits. Linked hover and keyboard focus delegate through row elements keyed by stable ID, highlighting matching priority rows, tiles, effect rows and omission rows. Hover takes precedence over focus and clicked selection; detached DOM rows cannot retain a hover highlight. Re-rendered views restore current highlights.

For multi-host modifiers, Attach to defaults to Either/Any and can pin one exact root. The optional request.coreId is authoritative; the solved placement.groupCoreId records the actual host. Switching/removing an ability preserves a pinned old ID and labels it unavailable, causing an omission/required failure until the user changes the choice. This affects trigger semantics for descriptions such as Agile Practices’s “Using this ability”; tile/effect tooltips and priority inclusion text name the actual host. Library hints explicitly say ONE of the compatible roots.

## Persistence

The storage key is `afe2.perk-planner.v0`, schema version 1. It holds the working draft, named snapshots, and game-data version. Configurations use stable asset IDs, class, rank, selected abilities, ordered requested IDs, and Required flags. Internal BigInt masks are never serialized.

Autosave only replaces the draft; saving a named build clones inputs. Save copy creates another ID. Failed writes report errors and do not add a pretend saved item. Unknown/future or malformed storage is preserved and further writes are blocked. Unknown catalog IDs remain editable requests; loading an older game's named build revalidates inputs and reruns the solver.

Local browser saves are bound to the browser profile and origin (host + scheme + port). Use the same development port to keep the same saves. There is no cross-device synchronization.

## Portable builds

Import/export uses the independent `afe2-perk-build` version-1 format. It contains a name, game-data version, and full input configuration; request order and Required flags are authoritative. Cached placements are never imported. Files and clipboard share the same parser, validation and one-MiB limit. The UI imports into the draft, clears the selected named-save identity, reconciles stale catalog IDs, and reruns the worker. Existing named snapshots are untouched. Invalid/future documents leave inputs unchanged. Clipboard failure expands a manual JSON fallback. See build-transfer.md for the schema and exact behavior.

## Tests

Unit tests cover solver geometry/objectives/groups/budgets, storage failures/versioning, current-data eligibility/replacements/effects, data-generation determinism, static packaging, and HTTP boundary handling. An independent exhaustive tiny-board enumerator checks inclusion optimality. Browser tests exercise actual catalog fetches, the real worker, DOM updates, named saves across reload, stale states, class/ability changes, blocked storage, failed resources, cancellation, and responsive layouts.

See `docs/testing.md` for commands and the checked-in verification report for the latest measured results. Screenshots and machine-readable run outputs are produced under ignored `work/evidence/`.

## Updating game data

1. Record the new Steam build with `scripts/Get-GameInventory.ps1`.
2. Run native extractors. If executable hashes differ, stop default/rule regeneration and audit the new executable. Never guess or simply bypass hash guards.
3. Convert/export class assets using `scripts/Export-GamePerks.ps1`; all tool binaries/raw assets stay under `work/`.
4. Normalize observations, regenerate resolved catalog and browser data, and review the diff. A new non-rectangular footprint will intentionally fail renderer-compatibility tests until the UI is updated.
5. Run catalog, unit, and browser tests. Update documentation and independently revalidate relevant in-game observation fixtures if their build context changes.

The committed generated data lets ordinary development and testing run without the game installed. Only research regeneration needs the installed game and Python/native tools.

## Static hosting and notices

The build copies the project MIT license, game-data notice, and Vite runtime-helper license into dist/. Preserve these when changing packaging. Vite uses a relative base so HTML, catalog, and worker URLs resolve under a project prefix. The test server supports --base-path /repo/ to exercise this layout.

The pinned Actions workflow validates every push/PR and deploys successful default-branch runs through the github-pages environment. Only the deployment job has Pages write/OIDC permissions. Repository Pages must use GitHub Actions as its source. See [deployment](deployment.md), [notice](../NOTICE.md), and [limitations](known-limitations.md).
