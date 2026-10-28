# Solver performance investigation — 2026-10-27

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
