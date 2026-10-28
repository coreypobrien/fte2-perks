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

Placement search handles connection-bearing pieces before unrelated standalone cores, then uses candidate counts. Failed placement states memoize occupancy and the identity/occupied mask of every connection-bearing piece; standalone cores are interchangeable obstacles. Identity and masks are essential for alternative footprints and group semantics. Cached geometric impossibility prunes all supersets. Connectivity failure alone must never prune supersets: a lower-priority requested core or bridge can rescue a higher or required modifier.

Partial placement pruning floods a relaxed union of compatible modifier candidate cells from each possible Core. It ignores conflicts between future candidates, group exclusivity, and overrides, making reachability a necessary condition only. It includes fixed modifiers and disables this flood for disconnected footprints, since the exact validator treats a chip as one graph node. Pruned connectivity branches conservatively prevent a geometric-impossibility claim. Final group assignment remains authoritative. Cached bitmask perimeters avoid repeatedly rebuilding geometry for final adjacency checks.

The required-only arrangement is an incumbent, never an infeasibility proof. A timeout returns the best valid arrangement found so far, including improvements made at partial subsets. Some crowded arrangements still need the longer budget; benchmarks are documented in solver-performance.md.

Final connectivity assigns each Modifier to exactly one compatible Core group. It permits orthogonal chains whose members all match the same root Core. Independent reachability is only pruning, since a shared bridge cannot serve two different groups at once. Per-group GrantedAbilityOverride exclusions apply. A memoized assignment search handles ambiguous groups; a single-core shortcut uses connectivity plus the override count.

Budget checks use both elapsed time and node limits. `optimal` means the inclusion vector is proven optimal within this model. `timeout` may contain a valid incumbent but never claims optimality or impossibility. `infeasible` follows completed search or a definitive required-unavailability check. `invalid` is an input error. Cancellation terminates the owned worker; job IDs reject stale messages.

## Eligibility and catalog scope

Native Type defaults to Core; native RestrictionType defaults to None. None bypasses the class restriction check. Kit uses the selected class (or subclass) against KitRestriction OR explicit AlternativeKitsAllowed. OriginKit remains acquisition metadata. There are no explicit Role restrictions in this catalog; that unsupported case fails closed.

The browser catalog preserves all 509 packaged chip definitions, 6 class boards, and fixed ability alternatives. Ability-slot entries appear in pickers rather than as ordinary requests. All 29 PerksOld records are retained because current entitlements reference them. Shared generic/weapon/reward acquisition membership remains incompletely traced; known grants in the selected class now follow its rank; other-class and unknown/shared unlock paths remain assumed available.

This is static native-code translation plus asset extraction, not direct runtime instrumentation. Replacement shape and group-merge edge cases, full acquisition/ownership progression, combat stacking arithmetic, and automated runtime parity remain research limits. Do not claim that every possible in-game case is certified.

## Library and priority interactions

Granting class uses known unlock-source class names, falling back to OriginKit only when no unlock source is recorded. It is a discovery filter, never an equip restriction. Core and Modifier checkboxes are independent. Show universal is checked initially; disabling it hides universal-use perks from other classes and shared progression while retaining known selected-class grants. Granting class still narrows results when Show universal is enabled. Show unavailable independently exposes disabled class-ineligible entries. Filter state is transient. Known ordinary-perk selected-class unlock sources are hidden below their earliest rank unless Show unavailable is checked, which exposes a disabled row with its rank reason. Changing rank refreshes the library immediately. Saved/imported future-rank requests remain visible in priorities and become solver omissions (or required failures), never silently deleted. A perk with no selected-class grant is not locked by another class’s rank. An unknown-rank selected-class path prevents assuming a lock. Fixed ability pickers retain their existing slot-option rules.

Expanded library descriptions are tracked by stable perk ID and survive adding/removing requests and filtering away/back. Priorities support native drag-and-drop plus keyboard-operable arrow buttons. Both reorder paths use the same stale-result and draft-save flow. New sessions start with an empty build-name field; loading a named snapshot fills its explicit name.

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
