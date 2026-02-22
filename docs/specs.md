# Specifcations

## Database Schema

Let's design a database schema for a fantasy baseball draft that will utilize Clerk.js organizations to handle each draft.

Most tables will have standard created_at / updated_at / and deleted_at for soft delete
For multi-tenancy, each league is a Clerk organization. Each manager is a Clerk user. User roles will be Commissioner, manager, onlooker. We will need support for co-managers and co-commissioners

Tables will be populated by CVS imports.

We will want to seed tables as well for development.

### Player Universe

An admin user (me) will import players and player stats, but we could allow commissioners to also upload their own player CSVs.

players is a table that includes the following columns. The first batch I know I get from Ottoneu

uuid?
player_id = This is the ID of the player within the draft system. Unique.
player_name = first and last name. String.
fangraphs_id = player’s ID in Fangraphs. Integer. May be null.
fangraphs_minors_id = player’s ID as a minor leaguer. String. May be null.
mlbam_id = player’s MLB ID.
birthday = player’s birthday. May be null.
positions = player’s position in a particular fantasy format. String.

All of these might be null -- not sure where I can source this info:

preferred_name
nick_names
bats
throws
height
weight
born (location)
links (to third party sources like bbref, sabr.org bios project, etc.)

### League and Team Setup

leagues is a table of leagues. Things get complicated with league, format, positions. A league may use be auction or draft.
Would a JSONB format help for rosters, which break down all sorts of ways -- for example standard Ottoneu: C, C, 1b, 2b, 3b, ss, MI, OF, OF, OF, OF, OF, Util, Bench (batters), Minors (batters), IL60, SP, RP, Bench (pitchers), Minors (pitchers), IL60. Other leagues may have CI, IL, etc.

Users can create a league which means mapping it to a Clerk org. We will probably wrap that ability in some authentication but for development we can allow self-service.

league_id = id that maps to the external game. Unique. Primary key?
clerk_id = way to link to clerk. Goal is to have clerk oranize permissions around the idea of a league = an org
teams = team_ids that reference the team table
league_name = String
league_format = String for now.
league_positions = All the roster slots allowed for each team
is_auction = Boolean
is_head_to_head = Boolean
league_cap = Can be null for non-auction leagues?
seasons = seasons the league was active by 4 digit year
commissioner = User or users with commissioner role in this league

Each team needs to be part of a league

team_id = id that maps to the external game. Unique. Primary key?
team_name = string
managers = one or more managers (link to Clerk authorization)
roster = rostered players by position (see the comment above about roster types). All positions should be listed as either filled by a player (via ID) or empty
rostered = players rostered in the past. Need to track player salary at time of cut, date stamp of cut, 
incoming loans = number
outgoing loans = number

player_stats will be a table of stats by player. These can be quite complex. We will either use a service or upload stats as a CSV that are parsed into tables.
fangraphs_id = primary key? Also need to lookup player info in players table by using either fangraphs_id OR fangraphs_minors_id
mlb_team = String. Can be FA
stats = A lot of stats. These will come from CSV upload or a third party service.

A stats Table could be useful to list all the known stats
uuid = primary key
abbreviation = should be unique. Should map to a stat imported into the player_stats table
description = stringf
format = string? i.e. #.### -- format used by the application i.e. string, date, integer, decimal of n digits




## Result (Gemini)

import { 
  pgTable, uuid, text, integer, varchar, boolean, 
  timestamp, date, jsonb, decimal, primaryKey 
} from "drizzle-orm/pg-core";

// Common Timestamps
const timestamps = {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
};

// --- 1. PLAYER UNIVERSE (GLOBAL DATA) ---
export const players = pgTable("players", {
  id: uuid("id").primaryKey().defaultRandom(),
  systemPlayerId: varchar("system_player_id").unique().notNull(),
  playerName: text("player_name").notNull(),
  // Corrected "FanGraphs" spelling
  fangraphsId: integer("fangraphs_id"),
  fangraphsMinorsId: varchar("fangraphs_minors_id"),
  mlbamId: integer("mlbam_id"),
  birthday: date("birthday"),
  positions: text("positions"), // e.g., "C, 1B"
  
  // Bio Data JSONB: { "nicknames": [], "links": {}, "born": "City, State" }
  bioData: jsonb("bio_data").default({}),
  ...timestamps,
});

export const statDefinitions = pgTable("stat_definitions", {
  id: uuid("id").primaryKey().defaultRandom(),
  abbreviation: varchar("abbreviation").unique().notNull(), // "HR", "wOBA"
  name: text("name"),
  format: varchar("format"), // "#.###"
  ...timestamps,
});

export const playerStats = pgTable("player_stats", {
  id: uuid("id").primaryKey().defaultRandom(),
  playerId: uuid("player_id").references(() => players.id).notNull(),
  season: integer("season").notNull(),
  mlbTeam: varchar("mlb_team", { length: 3 }),
  // Flexible Stats JSONB: { "HR": 40, "AVG": 0.300 }
  stats: jsonb("stats").notNull(),
  ...timestamps,
});

// --- 2. LEAGUE & MULTI-TENANCY (CLERK LINKED) ---
export const leagues = pgTable("leagues", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkOrgId: varchar("clerk_org_id").unique().notNull(), // Tenant Key
  leagueName: text("league_name").notNull(),
  leagueFormat: varchar("league_format"), // "Ottoneu", "Dynasty"
  
  // Roster Config JSONB: { "C": 2, "1B": 1, "Bench": 10 }
  rosterConfig: jsonb("roster_config").notNull(),
  
  isAuction: boolean("is_auction").default(false),
  isH2H: boolean("is_h2h").default(false),
  leagueCap: decimal("league_cap", { precision: 10, scale: 2 }),
  seasons: integer("seasons").array(),
  ...timestamps,
});

export const leagueMembers = pgTable("league_members", {
  clerkUserId: varchar("clerk_user_id").notNull(),
  leagueId: uuid("league_id").references(() => leagues.id).notNull(),
  role: varchar("role").notNull(), // "COMMISSIONER", "MANAGER"
}, (t) => ({
  pk: primaryKey({ columns: [t.clerkUserId, t.leagueId] }),
}));

// --- 3. TEAM & ROSTER LOGIC ---
export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  leagueId: uuid("league_id").references(() => leagues.id).notNull(),
  teamName: text("team_name").notNull(),
  
  // Current Roster JSONB: { "C_1": "player_uuid", "1B": "player_uuid" }
  currentRoster: jsonb("current_roster").default({}),
  
  // Finance JSONB: { "loans_in": 0, "loans_out": 0, "budget": 400 }
  financeData: jsonb("finance_data").default({}),
  ...timestamps,
});

export const rosterHistory = pgTable("roster_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id").references(() => teams.id).notNull(),
  playerId: uuid("player_id").references(() => players.id).notNull(),
  salaryAtCut: decimal("salary_at_cut", { precision: 10, scale: 2 }),
  cutDate: timestamp("cut_date").defaultNow(),
  ...timestamps,
});
