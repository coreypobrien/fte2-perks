# Machinist rank-10 in-game validation

Five seeded random priority lists for game build 26090957. Each has 24 optional requests, all explicitly granted by Machinist at rank 10 or below with no additional grant condition. Cross-class and unknown/shared unlocks are excluded. Fixed abilities use Machinist defaults or rank-appropriate Machinist replacements. Every modifier has a compatible selected fixed ability. The minimum total footprint exceeds the 42 free cells, so omissions are unavoidable. All Required flags are false to test priority choices rather than forcing an impossible loadout.

In the local planner, open Import / export build → Import file and select one of the five .afe2.json files. Class, rank, abilities, and the complete priority order load together. Select Find arrangement (the app search limit is fixed at 60 seconds). Save build creates a separate named snapshot. You can also open a file as text and use Paste build or Load pasted JSON.

The recorded reference layouts use a separate 10-second sampling budget; the app now allows 60 seconds. The files contain inputs, not trusted cached solutions. The app recomputes arrangements. The companion solutions.json records the generated reference results, including exact coordinates, IDs, and omission reasons. A timeout reference is a valid best-found arrangement and is not a proof of optimality. Solver layouts can vary by runtime budget.

For in-game validation, select the listed abilities and try the included placement coordinates below (column/row are one-based). Check footprint, allowed class, ability compatibility, orthogonal chains, one group per modifier, and ability overrides. Record any rejected placement, the in-game description, and whether another priority could replace an omission. Every requested perk has an explicit Machinist unlock-source record, and its unlock rank is listed below. Note any mismatch with the in-game rank or unlock availability.

## 24 priorities — machinist-1.afe2.json

Seed 1310300639; requested area 63 / 42 available cells. Reference timeout; 9 included, 15 omitted; 9152 search steps.

Abilities: primary: Rumble Turret; secondary: Bodyguard; passive: Dual Targeting.

| Priority | Perk | Unlock rank | Footprint | Reference position |
| --- | --- | --- | --- | --- |
| 1 | Electrical Surge | 10 | 3×1 | Column 2, row 2 |
| 2 | Scalable Machine Learning | 7 | 3×1 | Column 2, row 3 |
| 3 | Safety Off | 9 | 4×1 | Column 1, row 1 |
| 4 | Agile Practices | 9 | 3×1 | Column 8, row 1 |
| 5 | Self-Repair Systems II | 5 | 2×1 | Column 5, row 2 |
| 6 | Artificial Overclock | 4 | 3×1 | Column 5, row 1 |
| 7 | Single Targeting | 10 | 4×1 | Column 2, row 4 |
| 8 | Cross-Platform Synergy | 2 | 2×2 | Column 7, row 2 |
| 9 | Stay Back | 4 | 3×1 | Column 2, row 5 |
| 10 | Heavy Metal | 3 | 2×1 | Omitted |
| 11 | Double Tap | 8 | 2×1 | Omitted |
| 12 | Shrapnel Round | 7 | 2×1 | Omitted |
| 13 | Parasocial Relationship I | 2 | 2×1 | Omitted |
| 14 | Parasocial Relationship II | 5 | 2×1 | Omitted |
| 15 | Payback | 5 | 2×1 | Omitted |
| 16 | First Line of Defense | 4 | 3×1 | Omitted |
| 17 | Real-Time Resource Reclamation | 5 | 2×1 | Omitted |
| 18 | Resonating Impact | 6 | 3×1 | Omitted |
| 19 | Piercing Rounds | 7 | 4×1 | Omitted |
| 20 | Hard Hitting | 9 | 2×1 | Omitted |
| 21 | Heroic Programming | 2 | 2×1 | Omitted |
| 22 | Grand Entrance | 6 | 2×1 | Omitted |
| 23 | Distraction Algorithm | 7 | 2×1 | Omitted |
| 24 | Second Line of Defense | 5 | 2×1 | Omitted |

## 24 priorities — machinist-2.afe2.json

Seed 3964736408; requested area 61 / 42 available cells. Reference timeout; 9 included, 15 omitted; 8768 search steps.

Abilities: primary: Sentry Turret; secondary: Bodyguard; passive: Dual Targeting.

| Priority | Perk | Unlock rank | Footprint | Reference position |
| --- | --- | --- | --- | --- |
| 1 | Self-Repair Systems III | 7 | 2×1 | Column 4, row 2 |
| 2 | Cross-Platform Synergy | 2 | 2×2 | Column 6, row 2 |
| 3 | Electric Upgrade | 3 | 2×1 | Column 8, row 2 |
| 4 | Self-Repair Systems | 3 | 2×1 | Column 2, row 2 |
| 5 | Heroic Programming | 2 | 2×1 | Column 8, row 1 |
| 6 | Software Update | 3 | 4×1 | Column 1, row 1 |
| 7 | Parasocial Relationship I | 2 | 2×1 | Column 3, row 5 |
| 8 | Agile Practices | 9 | 3×1 | Column 5, row 1 |
| 9 | Group Effort | 10 | 4×1 | Column 2, row 4 |
| 10 | Piercing Rounds | 7 | 4×1 | Omitted |
| 11 | Real-Time Resource Reclamation | 5 | 2×1 | Omitted |
| 12 | Double Tap | 8 | 2×1 | Omitted |
| 13 | Safety Off | 9 | 4×1 | Omitted |
| 14 | High Voltage | 7 | 2×1 | Omitted |
| 15 | Reinforced Frame III | 6 | 2×1 | Omitted |
| 16 | Stay Back | 4 | 3×1 | Omitted |
| 17 | Reinforced Frame II | 4 | 2×1 | Omitted |
| 18 | Combo Bonus | 3 | 2×1 | Omitted |
| 19 | Controlled Burn | 8 | 2×1 | Omitted |
| 20 | Artificial Overclock | 4 | 3×1 | Omitted |
| 21 | Hard Hitting | 9 | 2×1 | Omitted |
| 22 | Heavy Metal | 3 | 2×1 | Omitted |
| 23 | Payback | 5 | 2×1 | Omitted |
| 24 | Forced Detonation | 10 | 2×1 | Omitted |

## 24 priorities — machinist-3.afe2.json

Seed 2324204881; requested area 70 / 42 available cells. Reference timeout; 4 included, 20 omitted; 7552 search steps.

Abilities: primary: Rumble Turret; secondary: Bodyguard; passive: Dual Targeting.

| Priority | Perk | Unlock rank | Footprint | Reference position |
| --- | --- | --- | --- | --- |
| 1 | Combo Bonus | 3 | 2×1 | Column 3, row 5 |
| 2 | Forced Detonation | 10 | 2×1 | Column 1, row 1 |
| 3 | Hard Hitting | 9 | 2×1 | Column 2, row 4 |
| 4 | Double Tap | 8 | 2×1 | Column 2, row 3 |
| 5 | Stay Back | 4 | 3×1 | Omitted |
| 6 | Parasocial Relationship I | 2 | 2×1 | Omitted |
| 7 | Scalable Machine Learning | 7 | 3×1 | Omitted |
| 8 | Piercing Rounds | 7 | 4×1 | Omitted |
| 9 | Self-Repair Systems | 3 | 2×1 | Omitted |
| 10 | Parasocial Relationship II | 5 | 2×1 | Omitted |
| 11 | Heavy Metal | 3 | 2×1 | Omitted |
| 12 | Increased Uptime | 10 | 10×1 | Omitted |
| 13 | Electrified | 6 | 2×1 | Omitted |
| 14 | Safety Off | 9 | 4×1 | Omitted |
| 15 | Compatibility Matrix | 6 | 3×1 | Omitted |
| 16 | Cross-Platform Synergy | 2 | 2×2 | Omitted |
| 17 | Single Targeting | 10 | 4×1 | Omitted |
| 18 | Self-Repair Systems II | 5 | 2×1 | Omitted |
| 19 | Resonating Impact | 6 | 3×1 | Omitted |
| 20 | Second Line of Defense | 5 | 2×1 | Omitted |
| 21 | Distraction Algorithm | 7 | 2×1 | Omitted |
| 22 | Shrapnel Round | 7 | 2×1 | Omitted |
| 23 | Parasocial Relationship III | 8 | 2×1 | Omitted |
| 24 | Software Update | 3 | 4×1 | Omitted |

## 24 priorities — machinist-4.afe2.json

Seed 683673354; requested area 59 / 42 available cells. Reference timeout; 10 included, 14 omitted; 5696 search steps.

Abilities: primary: Sentry Turret; secondary: Bodyguard; passive: Dual Targeting.

| Priority | Perk | Unlock rank | Footprint | Reference position |
| --- | --- | --- | --- | --- |
| 1 | Single Targeting | 10 | 4×1 | Column 2, row 4 |
| 2 | Cross-Platform Synergy | 2 | 2×2 | Column 4, row 2 |
| 3 | Veteran Machinist | 10 | 2×1 | Column 8, row 2 |
| 4 | Controlled Burn | 8 | 2×1 | Column 6, row 1 |
| 5 | Explosive Core | 9 | 2×1 | Column 4, row 1 |
| 6 | Fortitude - Machinist | 2 | 2×1 | Column 6, row 2 |
| 7 | Self-Repair Systems | 3 | 2×1 | Column 2, row 2 |
| 8 | Grand Entrance | 6 | 2×1 | Column 9, row 1 |
| 9 | Parasocial Relationship I | 2 | 2×1 | Column 3, row 5 |
| 10 | Artificial Overclock | 4 | 3×1 | Column 1, row 1 |
| 11 | Hard Hitting | 9 | 2×1 | Omitted |
| 12 | Double Tap | 8 | 2×1 | Omitted |
| 13 | Creative Pain Point Solutions | 8 | 3×1 | Omitted |
| 14 | Stay Back | 4 | 3×1 | Omitted |
| 15 | First Line of Defense | 4 | 3×1 | Omitted |
| 16 | High Voltage | 7 | 2×1 | Omitted |
| 17 | Heroic Programming | 2 | 2×1 | Omitted |
| 18 | Safety Off | 9 | 4×1 | Omitted |
| 19 | Combo Bonus | 3 | 2×1 | Omitted |
| 20 | Resonating Impact | 6 | 3×1 | Omitted |
| 21 | Second Line of Defense | 5 | 2×1 | Omitted |
| 22 | Heavy Metal | 3 | 2×1 | Omitted |
| 23 | Reinforced Frame II | 4 | 2×1 | Omitted |
| 24 | Self-Repair Systems III | 7 | 2×1 | Omitted |

## 24 priorities — machinist-5.afe2.json

Seed 3338109123; requested area 62 / 42 available cells. Reference timeout; 6 included, 18 omitted; 7872 search steps.

Abilities: primary: Rumble Turret; secondary: Shredder Bodyguard; passive: Dual Targeting.

| Priority | Perk | Unlock rank | Footprint | Reference position |
| --- | --- | --- | --- | --- |
| 1 | Kinetic Amplification Device | 8 | 3×1 | Column 1, row 1 |
| 2 | Stay Back | 4 | 3×1 | Column 2, row 4 |
| 3 | Second Line of Defense | 5 | 2×1 | Column 9, row 1 |
| 4 | Creative Pain Point Solutions | 8 | 3×1 | Column 2, row 5 |
| 5 | Resonating Impact | 6 | 3×1 | Column 2, row 2 |
| 6 | Brute | 8 | 3×1 | Column 6, row 1 |
| 7 | Parasocial Relationship II | 5 | 2×1 | Omitted |
| 8 | Heavy Metal | 3 | 2×1 | Omitted |
| 9 | Group Effort | 10 | 4×1 | Omitted |
| 10 | Cross-Platform Synergy | 2 | 2×2 | Omitted |
| 11 | Grand Entrance | 6 | 2×1 | Omitted |
| 12 | Single Targeting | 10 | 4×1 | Omitted |
| 13 | Thermal Upgrade | 5 | 2×1 | Omitted |
| 14 | Parasocial Relationship I | 2 | 2×1 | Omitted |
| 15 | Overloaded Capacitors | 7 | 2×1 | Omitted |
| 16 | Payback | 5 | 2×1 | Omitted |
| 17 | Explosive Core | 9 | 2×1 | Omitted |
| 18 | Combo Bonus | 3 | 2×1 | Omitted |
| 19 | Electrical Surge | 10 | 3×1 | Omitted |
| 20 | Reinforced Frame III | 6 | 2×1 | Omitted |
| 21 | Piercing Rounds | 7 | 4×1 | Omitted |
| 22 | Veteran Machinist | 10 | 2×1 | Omitted |
| 23 | Parasocial Relationship III | 8 | 2×1 | Omitted |
| 24 | Heroic Programming | 2 | 2×1 | Omitted |
