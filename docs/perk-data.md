# Proposed perk record

This is a design sketch, not a validated schema. Revise it after inspecting real assets.

Each record should capture:

- Stable asset identifier and internal name.
- Localized display name and full effect text.
- Perk category, class access, parent ability/core, and exclusions.
- Occupied grid cells as integer coordinate pairs relative to an origin.
- Allowed orientations, verified from game behavior or assets.
- Numerical effects, units, conditions, stacking behavior, and caps where known.
- Provenance: installed build, source package/object/property, extraction date, and verification status.

Keep unknowns explicit. Separate source observations from inferred planner rules. Preserve build-specific changes rather than silently overwriting older values.
