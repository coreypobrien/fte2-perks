# Solver performance investigation — 2026-10-28

Current solver: all five Machinist-only examples now prove optimality in roughly 0.03–1.3 seconds locally. See the connected-group search section at the end; the earlier timeout measurements below document previous implementations.

## Reported movable-root timeout — October 28

The exact 25-request player input is preserved in `tests/fixtures/machinist-movable-roots.afe2.json`. Artificial Overclock is explicitly pinned to Sentry Turret; Collaborative Analytics needs the lower-priority requested Cross-Platform Synergy core. Selecting that movable root previously sent the entire pack through position-first search, repeatedly scanning future candidate placements and testing disconnected geometries. This build is valid; it is a search-performance problem.

In a sequential Node 24.22.1 comparison on the same machine, the prior solver completed in **54,116 ms**, with **522,651 states**. That is close to the browser's 60-second ceiling and does not contradict the reported browser timeout. The revised solver completed in **649 ms / 5,918 states**, about **83× faster**. Both prove the same optimum: the first 14 requests included, the remaining 11 omitted. Different geometry is allowed; the explicit host pin is preserved. These are local timings, not device-independent guarantees.

Movable-root packs now use a short position-first trial, then constrained connected growth that interleaves root placement with already-rooted modifier placement. Future root candidate unions overestimate reachable space for capacity pruning; exact placement chooses one root position and every Modifier still belongs to exactly one compatible group. A bounded unsuccessful trial falls back to the original position-first exact algorithm. Completed failures alone enter caches. Fixed-root search and the UI's 60-second budget are unchanged.

The original 25 benchmark cases plus this reported build all finish within the default one-second budget locally (25 optimal, one deliberately infeasible). Tests retain the independent two-root oracle, add a movable-root/host-pin/override oracle, and require this exact input to prove optimality within 50,000 states. All five prior Machinist examples retain their 200,000-state bounds. The browser suite imports the exact file and checks the real worker's inclusion vector, 11 omissions, persisted inputs and turret assignment.

Reproduce with `git show 37b22e6:app/core/solver.js | Set-Content work/solver-timeout-before.mjs`, then `node scripts/benchmark-solver.mjs --only reported --budget-ms 60000 --baseline work/solver-timeout-before.mjs`. Evidence is in `work/evidence/solver-benchmarks-60000.json`; the full current benchmark is `work/evidence/solver-benchmarks.json`. Arbitrary crowded or ambiguous inputs can still time out.

The old search had two independent problems: it enumerated optional subsets until their leaves even when a modifier could not have any requested compatible root, and placement search explored disconnected configurations and permutations of interchangeable standalone cores. It also retained only a required-only incumbent. A timeout could therefore return zero optional perks after examining many valid smaller possibilities indirectly.

The revised search packs partial subsets to retain progressively better valid arrangements, prunes missing roots against selected plus undecided requests, and prunes supersets only for geometric impossibility. It places connection-bearing pieces first, memoizes semantic occupancy states, checks relaxed future reachability during placement, and caches geometry for exact group validation. Strict lexicographic priorities, required perks, fixed orientation, unique group membership, and per-group overrides are unchanged.

## Reproducible sample

Run from the repository root:

~~~powershell
node scripts/benchmark-solver.mjs
node scripts/benchmark-solver.mjs --budget-ms 10000 --only Medic-connected
~~~

For the comparison, materialize the prior committed solver in ignored work/:

~~~powershell
git show 3adc9f8:app/core/solver.js | Set-Content work/solver-before.mjs
node scripts/benchmark-solver.mjs --baseline work/solver-before.mjs
~~~

The 25 cases use the first 8/20/40 eligible non-slot definitions in stable catalog order for each class, four alphabetic Medic lists restricted to standalone cores or modifiers compatible with selected fixed abilities at ranks 5 and 10, and three synthetic boundaries. Catalog-order cases deliberately include disconnected universal modifiers: class eligibility alone does not guarantee an ability connection. These are a deterministic regression sample, not a claim about every possible player build. The game build is 26090957. Timings are local Node 24.19 measurements and vary with machine load.

The same 1,000 ms / 1,400,000-node limits were used for both implementations. Time is sampled periodically, so small overshoots are possible. The old implementation timed out in **15 of 25** cases; the revised implementation timed out in **3 of 25**, retaining 13–14 requested perks in those three cases.

| Case | Before | After |
| --- | --- | --- |
| Medic-20 | timeout, 0 perks / 1000 ms | optimal, 9 perks / 8 ms |
| Medic-40 | timeout, 0 perks / 1000 ms | optimal, 14 perks / 42 ms |
| Hunter-40 | timeout, 0 perks / 1000 ms | optimal, 14 perks / 106 ms |
| Machinist-40 | timeout, 0 perks / 1000 ms | optimal, 14 perks / 300 ms |
| Duelist-20 | timeout, 0 perks / 1000 ms | optimal, 12 perks / 72 ms |
| Medic-connected-40-rank-10 | timeout, 0 perks / 692 ms | timeout, 13 perks / 1004 ms |
| fragmented-12-squares | timeout, 0 perks / 547 ms | optimal, 6 perks / 96 ms |
| overcapacity-60-dots | optimal, 36 perks / 1 ms | optimal, 36 perks / 17 ms |

With the 10-second UI budget, the rank-10 compatible Medic 40-perk case completed optimally with 13 perks in **3,285 ms / 66,328 search steps**. The equivalent 20-perk case completed with 13 perks in **969 ms**. Rank-5 versions finished in 27–31 ms. An over-capacity required set was rejected immediately. A 60-dot list on 36 cells returns the first 36 priorities exactly. Small trivial cases can do more work than before because of incumbent construction (about 17 ms versus 1 ms for this dot case); the gain targets hard dependency and packing failures.

## Remaining edges and correctness safeguards

Marauder-40 and Duelist-40 still reached the one-second limit. Large connected-group searches remain combinatorial; a time limit returns a valid incumbent, not a proof of optimality or infeasibility. Raising a budget cannot guarantee a proof for arbitrary input. No artificial request cap was added beyond existing save validation.

The flood intentionally ignores conflicts between future candidates and group assignments, so it may miss an impossibility but cannot reject a real connected completion for contiguous footprints. Disconnected footprints bypass it. Fixed modifiers remain available as bridges. A connectivity-pruned branch conservatively prevents labeling the subset geometrically impossible. Memo keys preserve the mask and ID of connection-bearing pieces, including alternative shapes. Final exact group validation remains necessary.

Tests compare both standalone geometry and mixed core/modifier selections with independent exhaustive tiny-board enumeration. Regression tests cover 60 optional requests, improved timeout incumbents with a required perk, fixed bridges, sparse shapes, and deterministic step bounds on current game-data loadouts. The real-browser suite loads a 40-request draft and verifies the actual worker, 14 included requests, and 26 retained omissions. Machine-readable evidence is in work/evidence/solver-benchmarks.json and solver-benchmarks-10000.json.

## Progress-timer audit and 60-second budget

The six paired browser trials alternated the actual 250 ms UI timer on/off before caching changes, holding the worker at exactly 4,001 counted states. Included IDs and statuses matched. Median elapsed time was 2622 ms with the timer disabled and 2571 ms with it enabled (about -2.0%). This small difference is run-to-run variation; no timer slowdown was detected in this sample. Both variants kept the CSS spinner. The timer runs on the main thread, while solve runs in a module worker; shared CPU contention is still possible on different devices.

A Node CPU sample placed approximately 95% of solver samples under potentiallyConnected, with repeated hierarchical tag matching accounting for roughly 47%. The old step counter missed most of that work. For example, one 4,001-state sample performed 11,942,996 candidate checks, 72,416 relaxed reachability checks, and 1,668,764 flood iterations. The UI now calls these search states; raw work counters are included in solver responses.

Compatibility pairs and fixed masks are now precomputed; future candidate unions are reused across roots, and roots irrelevant to current target modifiers are skipped. Final connected-group validation and strict priority semantics are unchanged. Per-pack memoization is bounded to 50,000 states to limit memory retention during longer runs. The independent geometry/group oracle and fixed-work included-ID comparisons passed.

| Machinist example | Before, 4,001 states | After, 4,001 states | Speedup |
| --- | --- | --- | --- |
| 1 | 4303 ms | 916 ms | 4.7× |
| 2 | 4520 ms | 1009 ms | 4.5× |
| 3 | 5629 ms | 352 ms | 16.0× |
| 4 | 6085 ms | 1305 ms | 4.7× |
| 5 | 4185 ms | 767 ms | 5.5× |

These local Node measurements compare identical included IDs and state counts, and are not a guarantee for every build/device. The UI now permits 60,000 ms with maxNodes=Number.MAX_SAFE_INTEGER instead of the old 1,400,000-node cap. Explicit small node budgets remain supported by the pure solver for deterministic tests.

The full-budget case 1 ran for 60001 ms and explored 339,072 states, retaining 10 perks. It still timed out: the longer budget is not an optimality guarantee. Cancellation, stale-state handling, and valid best-found results remain intact.

Reproduction commands are in testing.md. Evidence: timer-profile-before.json, machinist-fixed-work.json, machinist-60-seconds.json, and the raw CPU profiles under work/. The earlier 25-case comparison above is historical; the current 25-case suite was rerun after caching changes with truthful timeout states retained.

## Direct connected-group search and single-host audit

The previous position-first search still enumerated many floating modifiers and relied on a relaxed cell flood to reject them. The fixed-root search now grows connected groups directly, assigning every Modifier to exactly one Core. Equivalent modifier geometry/host choices share one identity order, and Hall-style reachable-capacity bounds prune impossible group allocations. A short priority-first trial precedes a constrained-order retry; only completed failures are reused. Movable requested roots retain the position-first fallback because putting all free roots first regressed other kits.

Agile Practices was already an either/or compatibility match, not an AND requirement. The UI wording and hidden group assignment made that unclear. The solver now returns groupCoreId; the UI names the assigned side and offers an optional Attach to constraint. Default Auto explores either host. The constraint is preserved in draft/named/portable saves, and a missing selected host is explicit rather than silently changed.

The benchmark used the same 10-second wall budget and five unchanged Machinist-only priority inputs for both versions:

| Case | Previous result | New result | New time | Included perks |
| --- | --- | --- | --- | --- |
| 1 | timeout after 10005 ms | optimal | 26 ms | 15 |
| 2 | timeout after 10006 ms | optimal | 1313 ms | 15 |
| 3 | timeout after 10005 ms | optimal | 1242 ms | 14 |
| 4 | timeout after 10018 ms | optimal | 105 ms | 17 |
| 5 | timeout after 10004 ms | optimal | 134 ms | 15 |

All five new inclusion vectors dominate or equal the old valid incumbents and all five optima were proven within the implemented rule model. The 25-case standard suite also completed every case within its one-second per-case budget (24 optimal, one deliberately infeasible). These results are measured samples, not a guarantee for arbitrary requests or devices. The 60-second production ceiling and cancellation remain.

The independently enumerated tiny-board oracle now includes two roots, dual-compatible modifiers, explicit targets and required requests. It agrees with the solver across all tested priority orders. The earlier 60-second sample is superseded by this search. Refreshed examples/solutions.json and the human-readable guide now record optimal placements and a single named group for every modifier, for in-game validation.
