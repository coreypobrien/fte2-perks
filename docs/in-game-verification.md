# In-game verification requests

Requested 2026-10-26. All perk checks below are pending. Match display names rather than internal asset names. A missing serialized shape is unknown, not evidence that the perk has no footprint.

| Perk | Catalog | Extracted observation | In-game check |
| --- | --- | --- | --- |
| Doctor's Orders | Medic, rank 3 reference | Shape property omitted | Exact occupied cells / dimensions; whether it needs to connect to an ability |
| Concentrated Formula | Medic, rank 3 reference | Shape property omitted; tags mention Trauma Station and Poison | Exact occupied cells; attachment to ordinary and poison station variants |
| CQW Weapon Training | Universal weapon perk candidate | Shape property omitted; compatibility tags mention CQW | Exact occupied cells; connection requirement and any class restriction shown |
| Stack 'Em Up | Marauder, rank 5 reference | 4x1 mask `[1,1,1,4]` | Actual footprint and whether rotation is allowed |
| Resiliency | Medic, rank 10 reference | 10x1 mask `[1,2,3,4,5,6,7,8,9,10]`; temporary health lasts 300% longer | Whether it is present/selectable, actual footprint, and any placement restriction |

For a straight strip, a response like `Doctor's Orders: 1x1, standalone` is enough. For an irregular shape, use a small text diagram with `#` for occupied cells and `.` for gaps.

Confirmed board evidence: user reports `-1` is unusable and other numbers are unlock ranks. This confirmation does not automatically establish the meaning of the integer values in individual perk masks.
