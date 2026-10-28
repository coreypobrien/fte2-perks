# Machinist rank-10 in-game validation

Five seeded random priority lists for game build 26090957. Each has 24 optional requests: 12 granted by Machinist and 12 other eligible perks. Every modifier has a compatible selected fixed ability. The minimum total footprint exceeds the 42 free cells, so omissions are unavoidable. All Required flags are false to test priority choices rather than forcing an impossible loadout.

In the local planner, open Import / export build → Import file and select one of the five .afe2.json files. Class, rank, abilities, and the complete priority order load together. Select Find arrangement (the search limit is fixed at 10 seconds). Save build creates a separate named snapshot. You can also open a file as text and use Paste build or Load pasted JSON.

The files contain inputs, not trusted cached solutions. The app recomputes arrangements. The companion solutions.json records the generated reference results, including exact coordinates, IDs, and omission reasons. A timeout reference is a valid best-found arrangement and is not a proof of optimality. Solver layouts can vary by runtime budget.

For in-game validation, select the listed abilities and try the included placement coordinates below (column/row are one-based). Check footprint, allowed class, ability compatibility, orthogonal chains, one group per modifier, and ability overrides. Record any rejected placement, the in-game description, and whether another priority could replace an omission. Universal/shared acquisition paths remain incompletely traced; note any library entries unavailable in-game rather than assuming they are valid from their folder name.

## 24 priorities — machinist-1.afe2.json

Seed 1310300639; requested area 64 / 42 available cells. Reference timeout; 10 included, 14 omitted; 21568 search steps.

Abilities: primary: Rumble Turret; secondary: Bodyguard; passive: Dual Targeting.

| Priority | Perk | Footprint | Reference position |
| --- | --- | --- | --- |
| 1 | Scalable Machine Learning | 3×1 | Column 6, row 4 |
| 2 | Hard Hitting | 2×1 | Column 2, row 4 |
| 3 | Piercing Rounds | 4×1 | Column 3, row 2 |
| 4 | No Mercy | 10×1 | Column 1, row 1 |
| 5 | Distraction Algorithm | 2×1 | Column 2, row 3 |
| 6 | Tough Hombre | 2×1 | Column 5, row 5 |
| 7 | Parasocial Relationship II | 2×1 | Column 3, row 5 |
| 8 | Survival Instinct | 2×2 | Column 4, row 3 |
| 9 | Artificial Overclock | 3×1 | Column 7, row 2 |
| 10 | Drive | 3×1 | Column 6, row 3 |
| 11 | Improved Knockback | 2×1 | Omitted |
| 12 | Tenacity | 1×1 | Omitted |
| 13 | Fortitude - Medic | 2×1 | Omitted |
| 14 | Shrapnel Round | 2×1 | Omitted |
| 15 | Concussive Multiplier III | 3×1 | Omitted |
| 16 | Force Multiplier I | 1×1 | Omitted |
| 17 | Targeting Data Link | 2×1 | Omitted |
| 18 | Agile Practices | 3×1 | Omitted |
| 19 | Second Line of Defense | 2×1 | Omitted |
| 20 | Veteran Specialist | 2×1 | Omitted |
| 21 | Improved Recovery | 1×1 | Omitted |
| 22 | Double Tap | 2×1 | Omitted |
| 23 | Parasocial Relationship I | 2×1 | Omitted |
| 24 | Single Targeting | 4×1 | Omitted |

## 24 priorities — machinist-2.afe2.json

Seed 3964736408; requested area 61 / 42 available cells. Reference timeout; 7 included, 17 omitted; 14144 search steps.

Abilities: primary: Sentry Turret; secondary: Bodyguard; passive: Dual Targeting.

| Priority | Perk | Footprint | Reference position |
| --- | --- | --- | --- |
| 1 | Artificial Overclock | 3×1 | Column 2, row 2 |
| 2 | No Mercy | 10×1 | Column 1, row 1 |
| 3 | Narrow Miss | 2×1 | Column 7, row 2 |
| 4 | Resilience II | 2×1 | Column 5, row 2 |
| 5 | Double Tap | 2×1 | Column 2, row 3 |
| 6 | Combo Bonus | 2×1 | Column 3, row 5 |
| 7 | Hard Hitting | 2×1 | Column 2, row 4 |
| 8 | Electric Upgrade | 2×1 | Omitted |
| 9 | Fortitude - Marauder | 2×1 | Omitted |
| 10 | Payback | 2×1 | Omitted |
| 11 | Controlled Burn | 2×1 | Omitted |
| 12 | Concussive Multiplier IV | 4×1 | Omitted |
| 13 | Tenacity II | 2×1 | Omitted |
| 14 | Heroic Programming | 2×1 | Omitted |
| 15 | Self-Repair Systems | 2×1 | Omitted |
| 16 | Forced Detonation | 2×1 | Omitted |
| 17 | Urgent Maneuver | 2×1 | Omitted |
| 18 | Software Update | 4×1 | Omitted |
| 19 | Adaptive Gait | 2×1 | Omitted |
| 20 | Concussive Multiplier I | 1×1 | Omitted |
| 21 | Force Multiplier I | 1×1 | Omitted |
| 22 | Marathon Runner | 2×1 | Omitted |
| 23 | Piercing Rounds | 4×1 | Omitted |
| 24 | Hardened Frame | 2×1 | Omitted |

## 24 priorities — machinist-3.afe2.json

Seed 2324204881; requested area 69 / 42 available cells. Reference timeout; 11 included, 13 omitted; 9344 search steps.

Abilities: primary: Rumble Turret; secondary: Bodyguard; passive: Dual Targeting.

| Priority | Perk | Footprint | Reference position |
| --- | --- | --- | --- |
| 1 | Stay Back | 3×1 | Column 2, row 3 |
| 2 | Fortitude - Hunter | 2×1 | Column 7, row 5 |
| 3 | Compatibility Matrix | 3×1 | Column 2, row 2 |
| 4 | CQW Weapon Training | 2×2 | Column 5, row 4 |
| 5 | Veteran Marine | 4×1 | Column 5, row 3 |
| 6 | Electrified | 2×1 | Column 3, row 5 |
| 7 | Distraction Algorithm | 2×1 | Column 5, row 2 |
| 8 | Increased Uptime | 10×1 | Column 1, row 1 |
| 9 | Hard Hitting | 2×1 | Column 2, row 4 |
| 10 | Sleight of Hand | 3×1 | Column 7, row 2 |
| 11 | Bedside Manner | 2×1 | Column 7, row 4 |
| 12 | Piercing Rounds | 4×1 | Omitted |
| 13 | Fortitude - Medic | 2×1 | Omitted |
| 14 | Cover Recovery I | 2×1 | Omitted |
| 15 | Resonating Impact | 3×1 | Omitted |
| 16 | Parasocial Relationship III | 2×1 | Omitted |
| 17 | Tough Hombre | 2×1 | Omitted |
| 18 | Combo Bonus | 2×1 | Omitted |
| 19 | First-Aid Supplies | 2×2 | Omitted |
| 20 | Self-Repair Systems | 2×1 | Omitted |
| 21 | Extended Duration II | 2×1 | Omitted |
| 22 | Extended Duration I | 1×1 | Omitted |
| 23 | Jackpot | 2×1 | Omitted |
| 24 | Cross-Platform Synergy | 2×2 | Omitted |

## 24 priorities — machinist-4.afe2.json

Seed 683673354; requested area 75 / 42 available cells. Reference timeout; 7 included, 17 omitted; 15232 search steps.

Abilities: primary: Sentry Turret; secondary: Bodyguard; passive: Dual Targeting.

| Priority | Perk | Footprint | Reference position |
| --- | --- | --- | --- |
| 1 | Fortitude - Marauder | 2×1 | Column 2, row 3 |
| 2 | Artificial Overclock | 3×1 | Column 2, row 2 |
| 3 | Hard Hitting | 2×1 | Column 3, row 5 |
| 4 | High Voltage | 2×1 | Column 5, row 2 |
| 5 | Precision Weapon Training | 2×2 | Column 7, row 2 |
| 6 | Synth Hunter | 10×1 | Column 1, row 1 |
| 7 | Double Tap | 2×1 | Column 2, row 4 |
| 8 | Self-Repair Systems | 2×1 | Omitted |
| 9 | No Quarter | 3×1 | Omitted |
| 10 | Creative Pain Point Solutions | 3×1 | Omitted |
| 11 | Narrow Miss | 2×1 | Omitted |
| 12 | No Mercy | 10×1 | Omitted |
| 13 | Explosive Core | 2×1 | Omitted |
| 14 | Fortitude - Medic | 2×1 | Omitted |
| 15 | Force Multiplier II | 2×1 | Omitted |
| 16 | Cross-Platform Synergy | 2×2 | Omitted |
| 17 | Physician | 3×1 | Omitted |
| 18 | Safety Off | 4×1 | Omitted |
| 19 | Reinforced Frame II | 2×1 | Omitted |
| 20 | Second Line of Defense | 2×1 | Omitted |
| 21 | Bandolier II | 2×1 | Omitted |
| 22 | Tenacity II | 2×1 | Omitted |
| 23 | Parasocial Relationship I | 2×1 | Omitted |
| 24 | Survival Protocol | 3×1 | Omitted |

## 24 priorities — machinist-5.afe2.json

Seed 3338109123; requested area 66 / 42 available cells. Reference timeout; 8 included, 16 omitted; 10368 search steps.

Abilities: primary: Rumble Turret; secondary: Shredder Bodyguard; passive: Dual Targeting.

| Priority | Perk | Footprint | Reference position |
| --- | --- | --- | --- |
| 1 | Focused Stride | 2×1 | Column 5, row 2 |
| 2 | Explosive Core | 2×1 | Column 1, row 1 |
| 3 | Grand Entrance | 2×1 | Column 7, row 1 |
| 4 | Cross-Platform Synergy | 2×2 | Column 3, row 1 |
| 5 | Bedside Manner | 2×1 | Column 5, row 1 |
| 6 | Quick Charge I | 1×1 | Column 9, row 1 |
| 7 | Marathon Runner | 2×1 | Column 7, row 2 |
| 8 | Concussive Multiplier I | 1×1 | Column 10, row 1 |
| 9 | Thermal Upgrade | 2×1 | Omitted |
| 10 | Parasocial Relationship II | 2×1 | Omitted |
| 11 | Heavy Metal | 2×1 | Omitted |
| 12 | Piercing Rounds | 4×1 | Omitted |
| 13 | Payback | 2×1 | Omitted |
| 14 | Heavy Weapon Training | 2×2 | Omitted |
| 15 | Resonating Impact | 3×1 | Omitted |
| 16 | Veteran Machinist | 2×1 | Omitted |
| 17 | Creative Pain Point Solutions | 3×1 | Omitted |
| 18 | Narrow Miss | 2×1 | Omitted |
| 19 | Improved Recovery | 1×1 | Omitted |
| 20 | Tenacity III | 3×1 | Omitted |
| 21 | Rapid Deployment | 10×1 | Omitted |
| 22 | Medical Training | 3×1 | Omitted |
| 23 | Force Multiplier IV | 4×1 | Omitted |
| 24 | Electrical Surge | 3×1 | Omitted |
