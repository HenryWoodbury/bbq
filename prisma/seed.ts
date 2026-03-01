import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // ── Stat Definitions ──────────────────────────────────────────────────────
  const statDefs = await prisma.statDefinition.createMany({
    data: [
      { abbreviation: "PA", name: "Plate Appearances", format: "integer" },
      { abbreviation: "AB", name: "At Bats", format: "integer" },
      { abbreviation: "H", name: "Hits", format: "integer" },
      { abbreviation: "HR", name: "Home Runs", format: "integer" },
      { abbreviation: "RBI", name: "Runs Batted In", format: "integer" },
      { abbreviation: "SB", name: "Stolen Bases", format: "integer" },
      { abbreviation: "AVG", name: "Batting Average", format: "#.###" },
      { abbreviation: "OBP", name: "On-Base Percentage", format: "#.###" },
      { abbreviation: "SLG", name: "Slugging Percentage", format: "#.###" },
      { abbreviation: "wOBA", name: "Weighted On-Base Average", format: "#.###" },
      { abbreviation: "wRC+", name: "Weighted Runs Created Plus", format: "integer" },
      { abbreviation: "IP", name: "Innings Pitched", format: "#.#" },
      { abbreviation: "W", name: "Wins", format: "integer" },
      { abbreviation: "SV", name: "Saves", format: "integer" },
      { abbreviation: "K", name: "Strikeouts (Pitcher)", format: "integer" },
      { abbreviation: "ERA", name: "Earned Run Average", format: "#.##" },
      { abbreviation: "WHIP", name: "Walks + Hits per IP", format: "#.###" },
      { abbreviation: "FIP", name: "Fielding Independent Pitching", format: "#.##" },
    ],
    skipDuplicates: true,
  });
  console.log(`Created ${statDefs.count} stat definitions`);

  // ── Players ───────────────────────────────────────────────────────────────
  const player1 = await prisma.player.upsert({
    where: { playerId: "OTT-1001" },
    update: {},
    create: {
      playerId: "OTT-1001",
      playerName: "Shohei Ohtani",
      fangraphsId: 19755,
      mlbamId: 660271,
      birthday: new Date("1994-07-05"),
      positions: ["DH", "SP"],
      bioData: {
        preferred_name: "Shohei",
        nick_names: ["Showtime"],
        bats: "L",
        throws: "R",
        height: 76,
        weight: 210,
        born: "Oshu, Iwate, Japan",
        links: {
          bbref: "https://www.baseball-reference.com/players/o/ohtansh01.shtml",
        },
      },
    },
  });

  const player2 = await prisma.player.upsert({
    where: { playerId: "OTT-1002" },
    update: {},
    create: {
      playerId: "OTT-1002",
      playerName: "Ronald Acuña Jr.",
      fangraphsId: 18401,
      mlbamId: 660670,
      birthday: new Date("1997-12-18"),
      positions: ["OF"],
      bioData: {
        bats: "R",
        throws: "R",
        born: "La Guaira, Venezuela",
      },
    },
  });

  const player3 = await prisma.player.upsert({
    where: { playerId: "OTT-1003" },
    update: {},
    create: {
      playerId: "OTT-1003",
      playerName: "Mookie Betts",
      fangraphsId: 13611,
      mlbamId: 605141,
      birthday: new Date("1992-10-07"),
      positions: ["OF", "SS"],
      bioData: {
        preferredName: "Mookie",
        bats: "R",
        throws: "R",
        born: "Nashville, TN",
      },
    },
  });
  console.log(`Seeded players: ${player1.playerName}, ${player2.playerName}, ${player3.playerName}`);

  // ── Player Stats ──────────────────────────────────────────────────────────
  await prisma.playerStat.upsert({
    where: { playerId_season: { playerId: player1.id, season: 2024 } },
    update: {},
    create: {
      playerId: player1.id,
      season: 2024,
      mlbTeam: "LAD",
      stats: { PA: 597, HR: 54, RBI: 130, SB: 59, AVG: 0.31, OBP: 0.39, SLG: 0.646, wOBA: 0.443 },
    },
  });

  await prisma.playerStat.upsert({
    where: { playerId_season: { playerId: player2.id, season: 2024 } },
    update: {},
    create: {
      playerId: player2.id,
      season: 2024,
      mlbTeam: "ATL",
      stats: { PA: 135, HR: 10, RBI: 36, SB: 11, AVG: 0.28, OBP: 0.366, SLG: 0.51, wOBA: 0.376 },
    },
  });
  console.log("Seeded player stats");

  // ── Demo League (note: uses placeholder Clerk org ID for dev) ─────────────
  const league = await prisma.league.upsert({
    where: { clerkOrgId: "org_dev_placeholder" },
    update: {},
    create: {
      clerkOrgId: "org_dev_placeholder",
      leagueName: "BBQ Demo League",
      leagueFormat: "FGPTS",
      fantasyPlatform: "ottoneu",
      hostLeagueUrl: null,
      rosterConfig: {
        C: 2,
        "1B": 1,
        "2B": 1,
        "3B": 1,
        SS: 1,
        MI: 1,
        OF: 5,
        Util: 1,
        "Bench (batters)": 3,
        "Minors (batters)": 2,
        IL60: 2,
        SP: 9,
        RP: 3,
        "Bench (pitchers)": 3,
        "Minors (pitchers)": 2,
      },
      isAuction: true,
      isH2H: false,
      leagueCap: 400,
      seasons: [2024, 2025],
    },
  });
  console.log(`Seeded league: ${league.leagueName}`);

  // ── Demo Team ─────────────────────────────────────────────────────────────
  const team = await prisma.team.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      leagueId: league.id,
      teamName: "Smoke & Signals",
      currentRoster: {},
      financeData: { loans_in: 0, loans_out: 0, budget: 400, spent: 0 },
    },
  });
  console.log(`Seeded team: ${team.teamName}`);

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
