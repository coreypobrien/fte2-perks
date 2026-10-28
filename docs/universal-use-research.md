# Cross-class and universal-use eligibility

## Current conclusion for build 26090957

Unlock acquisition and equip eligibility are independent. A perk's class folder, OriginKit or entitlement reference does not by itself restrict which class can equip it.

The audited native constructor leaves RestrictionType at zero/None when omitted. The socket predicate dispatches None as unrestricted by class, and Kit through KitRestriction OR AlternativeKitsAllowed with class-lineage matching. OriginKit is acquisition metadata, not a class gate. Specialist alternative access alone does not make a Kit-restricted chip universal. No explicit Role restrictions occur in this catalog; that unsupported case fails closed. See native-chip-rules.md for offsets, enum evidence and code paths.

The serialized observations contain 352 explicit Kit restrictions and 157 omitted restrictions. The latter now resolve through the native None default; they are no longer an unresolved-classification bucket. Universal eligibility still requires geometry, compatible groups and any applicable acquisition assumptions.

## Current app behavior

Known selected-class ordinary-perk unlock paths obey its selected rank, using available lower-rank alternatives and retaining uncertainty for unknown-rank paths. Other-class and unknown/shared acquisition remain assumed unlocked; there is no account-wide ownership profile. The library's granting-class filter is a discovery filter, not an equip restriction.

Saves use stable asset IDs and preserve requests across class changes. The problem builder rechecks current eligibility and reports unavailable requests rather than deleting them. Universal perks are not duplicated into separate class records. Tests cover cross-class access, alternatives, native tag population and current PerksOld references.

## History and remaining scope

The first asset-only pass could not establish omitted native defaults. That limitation is resolved by the executable audit and is preserved only as research history. Full acquisition routes, every runtime replacement/merge edge and future patches remain separate work. User observations are independent tests, never production overrides.
