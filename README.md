# Aliens: Fireteam Elite 2 — perk research and planner

Gather reproducible information from a local game installation, then build a perk-grid planner using verified data.

## First steps

Run from the repository root in PowerShell:

```powershell
.\scripts\Get-GameInventory.ps1
```

The script reads the Steam manifest and lists packaged assets without modifying the game. It writes a small JSON inventory to `data/inventory/installed-game.json`. Override `-SteamAppsPath` for a different Steam library.

## Layout

- `docs/research.md`: findings, open questions, and extraction plan.
- `data/inventory/`: reproducible installation and archive metadata.
- `data/perks/`: future normalized perk records; see `docs/perk-data.md`.
- `scripts/`: research and extraction helpers.
- `work/`: ignored scratch files and local extraction tools.

## Milestones

1. Identify the installed build and archive formats.
2. Decode sample perk assets, including shapes and dependencies.
3. Extract and validate a versioned perk catalog.
4. Build a grid editor with compatibility validation and saved builds.
5. Add automatic placement for a selected set of perks.

Game archives and bulk extracted assets are excluded from Git. Record provenance and uncertainty for every extracted field. No planner or perk decoder has been implemented yet.
