> **Status: Reference** 

## Player Map and Universe

Global data shared across all leagues. The canonical player list is sourced from the [Smart Fantasy Baseball Player ID Map](https://www.smartfantasybaseball.com/PLAYERIDMAPCSV) — ~750 fantasy-relevant players updated infrequently. Admins trigger a remote sync via the Admin UI. Admins and Commissioners can also add players to the list. For development the `Player` table may be seeded by the `sources/PLAYERIDMAP.csv`.

The player map is supplemented by a format-specific player universe, `PlayerUniverse`, that provides the full list of players in a designated format and their positions.

Player stats are uploaded globally, but can be overridden for specific drafts.

---

## Player Stats

For a specific draft, player stats can be uploaded as CSV files to populate stat tables.