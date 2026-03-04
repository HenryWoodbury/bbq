import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // ── Stat Definitions ──────────────────────────────────────────────────────
  // Wipe and re-seed for idempotency (no FK deps on stat_definitions).
  await prisma.statDefinition.deleteMany({});

  type SD = { abbreviation: string; name: string; format: string; playerType: "BATTER" | "PITCHER" };

  const batterStats: SD[] = [
    { abbreviation: "G",     name: "Games",                        format: "integer", playerType: "BATTER" },
    { abbreviation: "PA",    name: "Plate Appearances",            format: "integer", playerType: "BATTER" },
    { abbreviation: "AB",    name: "At Bats",                      format: "integer", playerType: "BATTER" },
    { abbreviation: "H",     name: "Hits",                         format: "integer", playerType: "BATTER" },
    { abbreviation: "1B",    name: "Singles",                      format: "integer", playerType: "BATTER" },
    { abbreviation: "2B",    name: "Doubles",                      format: "integer", playerType: "BATTER" },
    { abbreviation: "3B",    name: "Triples",                      format: "integer", playerType: "BATTER" },
    { abbreviation: "HR",    name: "Home Runs",                    format: "integer", playerType: "BATTER" },
    { abbreviation: "R",     name: "Runs",                         format: "integer", playerType: "BATTER" },
    { abbreviation: "RBI",   name: "Runs Batted In",               format: "integer", playerType: "BATTER" },
    { abbreviation: "BB",    name: "Walks",                        format: "integer", playerType: "BATTER" },
    { abbreviation: "IBB",   name: "Intentional Walks",            format: "integer", playerType: "BATTER" },
    { abbreviation: "SO",    name: "Strikeouts",                   format: "integer", playerType: "BATTER" },
    { abbreviation: "HBP",   name: "Hit by Pitch",                 format: "integer", playerType: "BATTER" },
    { abbreviation: "SF",    name: "Sacrifice Fly",                format: "integer", playerType: "BATTER" },
    { abbreviation: "SH",    name: "Sacrifice Bunt",               format: "integer", playerType: "BATTER" },
    { abbreviation: "GDP",   name: "Grounded into Double Play",    format: "integer", playerType: "BATTER" },
    { abbreviation: "SB",    name: "Stolen Bases",                 format: "integer", playerType: "BATTER" },
    { abbreviation: "CS",    name: "Caught Stealing",              format: "integer", playerType: "BATTER" },
    { abbreviation: "AVG",   name: "Batting Average",              format: "#.###",   playerType: "BATTER" },
    { abbreviation: "OBP",   name: "On-Base Percentage",           format: "#.###",   playerType: "BATTER" },
    { abbreviation: "SLG",   name: "Slugging Percentage",          format: "#.###",   playerType: "BATTER" },
    { abbreviation: "OPS",   name: "On-Base Plus Slugging",        format: "#.###",   playerType: "BATTER" },
    { abbreviation: "ISO",   name: "Isolated Power",               format: "#.###",   playerType: "BATTER" },
    { abbreviation: "BABIP", name: "BABIP",                        format: "#.###",   playerType: "BATTER" },
    { abbreviation: "BB%",   name: "Walk Rate",                    format: "#.#%",    playerType: "BATTER" },
    { abbreviation: "K%",    name: "Strikeout Rate",               format: "#.#%",    playerType: "BATTER" },
    { abbreviation: "BB/K",  name: "Walk-to-Strikeout Ratio",      format: "#.##",    playerType: "BATTER" },
    { abbreviation: "wOBA",  name: "Weighted On-Base Average",     format: "#.###",   playerType: "BATTER" },
    { abbreviation: "xwOBA", name: "Expected wOBA",                format: "#.###",   playerType: "BATTER" },
    { abbreviation: "wRC+",  name: "Weighted Runs Created Plus",   format: "integer", playerType: "BATTER" },
    { abbreviation: "wRC",   name: "Weighted Runs Created",        format: "#.#",     playerType: "BATTER" },
    { abbreviation: "wRAA",  name: "Weighted Runs Above Average",  format: "#.#",     playerType: "BATTER" },
    { abbreviation: "BsR",   name: "Base Running Runs",            format: "#.#",     playerType: "BATTER" },
    { abbreviation: "Off",   name: "Offensive Runs Above Average", format: "#.#",     playerType: "BATTER" },
    { abbreviation: "Def",   name: "Defensive Runs Above Average", format: "#.#",     playerType: "BATTER" },
    { abbreviation: "Spd",   name: "Speed Score",                  format: "#.#",     playerType: "BATTER" },
    { abbreviation: "UBR",   name: "Ultimate Base Running",        format: "#.#",     playerType: "BATTER" },
    { abbreviation: "wSB",   name: "Weighted Stolen Base Runs",    format: "#.#",     playerType: "BATTER" },
    { abbreviation: "wGDP",  name: "Weighted GIDP Runs",           format: "#.#",     playerType: "BATTER" },
    { abbreviation: "XBR",   name: "Extra Base Runs",              format: "#.#",     playerType: "BATTER" },
    { abbreviation: "WAR",   name: "Wins Above Replacement",       format: "#.#",     playerType: "BATTER" },
  ];

  const pitcherStats: SD[] = [
    { abbreviation: "W",     name: "Wins",                         format: "integer", playerType: "PITCHER" },
    { abbreviation: "L",     name: "Losses",                       format: "integer", playerType: "PITCHER" },
    { abbreviation: "SV",    name: "Saves",                        format: "integer", playerType: "PITCHER" },
    { abbreviation: "HLD",   name: "Holds",                        format: "integer", playerType: "PITCHER" },
    { abbreviation: "BS",    name: "Blown Saves",                  format: "integer", playerType: "PITCHER" },
    { abbreviation: "G",     name: "Games",                        format: "integer", playerType: "PITCHER" },
    { abbreviation: "GS",    name: "Games Started",                format: "integer", playerType: "PITCHER" },
    { abbreviation: "IP",    name: "Innings Pitched",              format: "#.#",     playerType: "PITCHER" },
    { abbreviation: "TBF",   name: "Total Batters Faced",          format: "integer", playerType: "PITCHER" },
    { abbreviation: "H",     name: "Hits Allowed",                 format: "integer", playerType: "PITCHER" },
    { abbreviation: "R",     name: "Runs Allowed",                 format: "integer", playerType: "PITCHER" },
    { abbreviation: "ER",    name: "Earned Runs",                  format: "integer", playerType: "PITCHER" },
    { abbreviation: "HR",    name: "Home Runs Allowed",            format: "integer", playerType: "PITCHER" },
    { abbreviation: "BB",    name: "Walks",                        format: "integer", playerType: "PITCHER" },
    { abbreviation: "IBB",   name: "Intentional Walks",            format: "integer", playerType: "PITCHER" },
    { abbreviation: "HBP",   name: "Hit Batsmen",                  format: "integer", playerType: "PITCHER" },
    { abbreviation: "SO",    name: "Strikeouts",                   format: "integer", playerType: "PITCHER" },
    { abbreviation: "K/9",   name: "Strikeouts per 9 IP",          format: "#.##",    playerType: "PITCHER" },
    { abbreviation: "BB/9",  name: "Walks per 9 IP",               format: "#.##",    playerType: "PITCHER" },
    { abbreviation: "HR/9",  name: "Home Runs per 9 IP",           format: "#.##",    playerType: "PITCHER" },
    { abbreviation: "K/BB",  name: "Strikeout-to-Walk Ratio",      format: "#.##",    playerType: "PITCHER" },
    { abbreviation: "K%",    name: "Strikeout Rate",               format: "#.#%",    playerType: "PITCHER" },
    { abbreviation: "BB%",   name: "Walk Rate",                    format: "#.#%",    playerType: "PITCHER" },
    { abbreviation: "K-BB%", name: "Strikeout minus Walk Rate",    format: "#.#%",    playerType: "PITCHER" },
    { abbreviation: "AVG",   name: "Batting Average Against",      format: "#.###",   playerType: "PITCHER" },
    { abbreviation: "WHIP",  name: "Walks + Hits per IP",          format: "#.###",   playerType: "PITCHER" },
    { abbreviation: "BABIP", name: "BABIP",                        format: "#.###",   playerType: "PITCHER" },
    { abbreviation: "LOB%",  name: "Left on Base Percentage",      format: "#.#%",    playerType: "PITCHER" },
    { abbreviation: "GB%",   name: "Ground Ball Percentage",       format: "#.#%",    playerType: "PITCHER" },
    { abbreviation: "ERA",   name: "Earned Run Average",           format: "#.##",    playerType: "PITCHER" },
    { abbreviation: "FIP",   name: "Fielding Independent Pitching",format: "#.##",    playerType: "PITCHER" },
    { abbreviation: "WAR",   name: "Wins Above Replacement",       format: "#.#",     playerType: "PITCHER" },
  ];

  await prisma.statDefinition.createMany({ data: [...batterStats, ...pitcherStats] });

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
  // ── Optional: seed a commissioner membership for local dev ────────────────
  // Set SEED_COMMISSIONER_ID=user_xxxx in .env.local (Clerk userId from dashboard).
  const seedUserId = process.env.SEED_COMMISSIONER_ID;
  if (seedUserId) {
    await prisma.leagueMember.upsert({
      where: { clerkUserId_leagueId: { clerkUserId: seedUserId, leagueId: league.id } },
      update: {},
      create: { clerkUserId: seedUserId, leagueId: league.id, role: "COMMISSIONER" },
    });
  }
}

main()
  .catch((e) => {
    process.stderr.write(`${e}\n`);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
