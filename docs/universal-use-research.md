# Cross-class and universal-use eligibility

## User requirement

A perk unlocked through one class can be usable in other classes. Model unlock acquisition and equip eligibility independently. Do not treat a class folder or a class entitlement reference as proof that the perk is restricted to that class.

## Current asset observations — build 26090957

The raw normalized properties preserve `OriginKit`, `RestrictionType`, `KitRestriction`, and `AlternativeKitsAllowed`. Class definitions preserve `ChipEntitlements`, `RequiredRank`, and `GrantedBy`.

- 352 packaged chips explicitly serialize `RestrictionType = EModChipRestrictionType::Kit`.
- 157 omit `RestrictionType`. Its native default and consuming predicate still need decoding; omission is not proof of universal use.
- For example, Prolonged Incineration includes both OriginKit and KitRestriction pointing to the Marauder's internal Demolisher class, omits RestrictionType, and records Specialist as AlternativeKitsAllowed. Its entitlement reference appears in Marauder at rank 8. This illustrates why no single field can decide eligibility.
- Specialist alternative access is a distinct concept from universal access to all classes.

These findings identify the next code path to trace. They do not establish a complete universal-use classifier.

## Data contract to implement

- Unlock path: source class/rank, weapon progression, reward or other acquisition conditions.
- Equip scope: universal or explicit allowed classes, plus dependencies and special exceptions.
- Evidence: serialized property/native predicate provenance and game build.
- Unresolved scope: explicit unknown state; no production overrides derived from a user checklist.

v0 can assume all perks are unlocked while still applying game-derived equip scope correctly. Saved builds use stable IDs and are revalidated against the selected class on load. Do not duplicate the same universal perk into unrelated class-specific records solely to make it appear in multiple lists.
