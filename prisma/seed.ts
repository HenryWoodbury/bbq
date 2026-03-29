import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  // ── Stat Definitions ──────────────────────────────────────────────────────
  // Wipe and re-seed for idempotency (no FK deps on stat_definitions).
  await prisma.statDefinition.deleteMany({})

  type SD = {
    abbreviation: string
    name: string
    format: string
    playerType: "BATTER" | "PITCHER"
  }

  const batterStats: SD[] = [
    {
      abbreviation: "G",
      name: "Games",
      format: "integer",
      playerType: "BATTER",
    },
    {
      abbreviation: "PA",
      name: "Plate Appearances",
      format: "integer",
      playerType: "BATTER",
    },
    {
      abbreviation: "AB",
      name: "At Bats",
      format: "integer",
      playerType: "BATTER",
    },
    {
      abbreviation: "H",
      name: "Hits",
      format: "integer",
      playerType: "BATTER",
    },
    {
      abbreviation: "1B",
      name: "Singles",
      format: "integer",
      playerType: "BATTER",
    },
    {
      abbreviation: "2B",
      name: "Doubles",
      format: "integer",
      playerType: "BATTER",
    },
    {
      abbreviation: "3B",
      name: "Triples",
      format: "integer",
      playerType: "BATTER",
    },
    {
      abbreviation: "HR",
      name: "Home Runs",
      format: "integer",
      playerType: "BATTER",
    },
    {
      abbreviation: "R",
      name: "Runs",
      format: "integer",
      playerType: "BATTER",
    },
    {
      abbreviation: "RBI",
      name: "Runs Batted In",
      format: "integer",
      playerType: "BATTER",
    },
    {
      abbreviation: "BB",
      name: "Walks",
      format: "integer",
      playerType: "BATTER",
    },
    {
      abbreviation: "IBB",
      name: "Intentional Walks",
      format: "integer",
      playerType: "BATTER",
    },
    {
      abbreviation: "SO",
      name: "Strikeouts",
      format: "integer",
      playerType: "BATTER",
    },
    {
      abbreviation: "HBP",
      name: "Hit by Pitch",
      format: "integer",
      playerType: "BATTER",
    },
    {
      abbreviation: "SF",
      name: "Sacrifice Fly",
      format: "integer",
      playerType: "BATTER",
    },
    {
      abbreviation: "SH",
      name: "Sacrifice Bunt",
      format: "integer",
      playerType: "BATTER",
    },
    {
      abbreviation: "GDP",
      name: "Grounded into Double Play",
      format: "integer",
      playerType: "BATTER",
    },
    {
      abbreviation: "SB",
      name: "Stolen Bases",
      format: "integer",
      playerType: "BATTER",
    },
    {
      abbreviation: "CS",
      name: "Caught Stealing",
      format: "integer",
      playerType: "BATTER",
    },
    {
      abbreviation: "AVG",
      name: "Batting Average",
      format: "#.###",
      playerType: "BATTER",
    },
    {
      abbreviation: "OBP",
      name: "On-Base Percentage",
      format: "#.###",
      playerType: "BATTER",
    },
    {
      abbreviation: "SLG",
      name: "Slugging Percentage",
      format: "#.###",
      playerType: "BATTER",
    },
    {
      abbreviation: "OPS",
      name: "On-Base Plus Slugging",
      format: "#.###",
      playerType: "BATTER",
    },
    {
      abbreviation: "ISO",
      name: "Isolated Power",
      format: "#.###",
      playerType: "BATTER",
    },
    {
      abbreviation: "BABIP",
      name: "BABIP",
      format: "#.###",
      playerType: "BATTER",
    },
    {
      abbreviation: "BB%",
      name: "Walk Rate",
      format: "#.#%",
      playerType: "BATTER",
    },
    {
      abbreviation: "K%",
      name: "Strikeout Rate",
      format: "#.#%",
      playerType: "BATTER",
    },
    {
      abbreviation: "BB/K",
      name: "Walk-to-Strikeout Ratio",
      format: "#.##",
      playerType: "BATTER",
    },
    {
      abbreviation: "wOBA",
      name: "Weighted On-Base Average",
      format: "#.###",
      playerType: "BATTER",
    },
    {
      abbreviation: "xwOBA",
      name: "Expected wOBA",
      format: "#.###",
      playerType: "BATTER",
    },
    {
      abbreviation: "wRC+",
      name: "Weighted Runs Created Plus",
      format: "integer",
      playerType: "BATTER",
    },
    {
      abbreviation: "wRC",
      name: "Weighted Runs Created",
      format: "#.#",
      playerType: "BATTER",
    },
    {
      abbreviation: "wRAA",
      name: "Weighted Runs Above Average",
      format: "#.#",
      playerType: "BATTER",
    },
    {
      abbreviation: "BsR",
      name: "Base Running Runs",
      format: "#.#",
      playerType: "BATTER",
    },
    {
      abbreviation: "Off",
      name: "Offensive Runs Above Average",
      format: "#.#",
      playerType: "BATTER",
    },
    {
      abbreviation: "Def",
      name: "Defensive Runs Above Average",
      format: "#.#",
      playerType: "BATTER",
    },
    {
      abbreviation: "Spd",
      name: "Speed Score",
      format: "#.#",
      playerType: "BATTER",
    },
    {
      abbreviation: "UBR",
      name: "Ultimate Base Running",
      format: "#.#",
      playerType: "BATTER",
    },
    {
      abbreviation: "wSB",
      name: "Weighted Stolen Base Runs",
      format: "#.#",
      playerType: "BATTER",
    },
    {
      abbreviation: "wGDP",
      name: "Weighted GIDP Runs",
      format: "#.#",
      playerType: "BATTER",
    },
    {
      abbreviation: "XBR",
      name: "Extra Base Runs",
      format: "#.#",
      playerType: "BATTER",
    },
    {
      abbreviation: "WAR",
      name: "Wins Above Replacement",
      format: "#.#",
      playerType: "BATTER",
    },
  ]

  const pitcherStats: SD[] = [
    {
      abbreviation: "W",
      name: "Wins",
      format: "integer",
      playerType: "PITCHER",
    },
    {
      abbreviation: "L",
      name: "Losses",
      format: "integer",
      playerType: "PITCHER",
    },
    {
      abbreviation: "SV",
      name: "Saves",
      format: "integer",
      playerType: "PITCHER",
    },
    {
      abbreviation: "HLD",
      name: "Holds",
      format: "integer",
      playerType: "PITCHER",
    },
    {
      abbreviation: "BS",
      name: "Blown Saves",
      format: "integer",
      playerType: "PITCHER",
    },
    {
      abbreviation: "G",
      name: "Games",
      format: "integer",
      playerType: "PITCHER",
    },
    {
      abbreviation: "GS",
      name: "Games Started",
      format: "integer",
      playerType: "PITCHER",
    },
    {
      abbreviation: "IP",
      name: "Innings Pitched",
      format: "#.#",
      playerType: "PITCHER",
    },
    {
      abbreviation: "TBF",
      name: "Total Batters Faced",
      format: "integer",
      playerType: "PITCHER",
    },
    {
      abbreviation: "H",
      name: "Hits Allowed",
      format: "integer",
      playerType: "PITCHER",
    },
    {
      abbreviation: "R",
      name: "Runs Allowed",
      format: "integer",
      playerType: "PITCHER",
    },
    {
      abbreviation: "ER",
      name: "Earned Runs",
      format: "integer",
      playerType: "PITCHER",
    },
    {
      abbreviation: "HR",
      name: "Home Runs Allowed",
      format: "integer",
      playerType: "PITCHER",
    },
    {
      abbreviation: "BB",
      name: "Walks",
      format: "integer",
      playerType: "PITCHER",
    },
    {
      abbreviation: "IBB",
      name: "Intentional Walks",
      format: "integer",
      playerType: "PITCHER",
    },
    {
      abbreviation: "HBP",
      name: "Hit Batsmen",
      format: "integer",
      playerType: "PITCHER",
    },
    {
      abbreviation: "SO",
      name: "Strikeouts",
      format: "integer",
      playerType: "PITCHER",
    },
    {
      abbreviation: "K/9",
      name: "Strikeouts per 9 IP",
      format: "#.##",
      playerType: "PITCHER",
    },
    {
      abbreviation: "BB/9",
      name: "Walks per 9 IP",
      format: "#.##",
      playerType: "PITCHER",
    },
    {
      abbreviation: "HR/9",
      name: "Home Runs per 9 IP",
      format: "#.##",
      playerType: "PITCHER",
    },
    {
      abbreviation: "K/BB",
      name: "Strikeout-to-Walk Ratio",
      format: "#.##",
      playerType: "PITCHER",
    },
    {
      abbreviation: "K%",
      name: "Strikeout Rate",
      format: "#.#%",
      playerType: "PITCHER",
    },
    {
      abbreviation: "BB%",
      name: "Walk Rate",
      format: "#.#%",
      playerType: "PITCHER",
    },
    {
      abbreviation: "K-BB%",
      name: "Strikeout minus Walk Rate",
      format: "#.#%",
      playerType: "PITCHER",
    },
    {
      abbreviation: "AVG",
      name: "Batting Average Against",
      format: "#.###",
      playerType: "PITCHER",
    },
    {
      abbreviation: "WHIP",
      name: "Walks + Hits per IP",
      format: "#.###",
      playerType: "PITCHER",
    },
    {
      abbreviation: "BABIP",
      name: "BABIP",
      format: "#.###",
      playerType: "PITCHER",
    },
    {
      abbreviation: "LOB%",
      name: "Left on Base Percentage",
      format: "#.#%",
      playerType: "PITCHER",
    },
    {
      abbreviation: "GB%",
      name: "Ground Ball Percentage",
      format: "#.#%",
      playerType: "PITCHER",
    },
    {
      abbreviation: "ERA",
      name: "Earned Run Average",
      format: "#.##",
      playerType: "PITCHER",
    },
    {
      abbreviation: "FIP",
      name: "Fielding Independent Pitching",
      format: "#.##",
      playerType: "PITCHER",
    },
    {
      abbreviation: "WAR",
      name: "Wins Above Replacement",
      format: "#.#",
      playerType: "PITCHER",
    },
  ]

  await prisma.statDefinition.createMany({
    data: [...batterStats, ...pitcherStats],
  })

  // Templates must exist before the demo league references them
  await seedLeagueTemplates()

  // ── Demo League (note: uses placeholder Clerk org ID for dev) ─────────────
  const fgptsTemplate = await prisma.leagueTemplate.findUniqueOrThrow({
    where: { name: "Ottoneu FGPTs" },
  })

  const league = await prisma.league.upsert({
    where: { clerkOrgId: "org_dev_placeholder" },
    update: { templateId: fgptsTemplate.id },
    create: {
      clerkOrgId: "org_dev_placeholder",
      leagueName: "BBQ Demo League",
      templateId: fgptsTemplate.id,
      hostLeagueUrl: null,
      seasons: [2024, 2025],
    },
  })
  // ── Demo Team ─────────────────────────────────────────────────────────────
  await prisma.team.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      leagueId: league.id,
      teamName: "Smoke & Signals",
      currentRoster: {},
      financeData: { loans_in: 0, loans_out: 0, budget: 400, spent: 0 },
    },
  })
  // ── Optional: seed a commissioner membership for local dev ────────────────
  // Set SEED_COMMISSIONER_ID=user_xxxx in .env.local (Clerk userId from dashboard).
  const seedUserId = process.env.SEED_COMMISSIONER_ID
  if (seedUserId) {
    await prisma.leagueMember.upsert({
      where: {
        clerkUserId_leagueId: { clerkUserId: seedUserId, leagueId: league.id },
      },
      update: {},
      create: {
        clerkUserId: seedUserId,
        leagueId: league.id,
        role: "COMMISSIONER",
      },
    })
  }
}

main()
  .catch((e) => {
    process.stderr.write(`${e}\n`)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

async function seedLeagueTemplates() {
  // Roster slot arrays — BN covers bench, minors, and IL (no separation at draft time)
  const ESPN_ROSTER: string[] = [
    "C",
    "1B",
    "2B",
    "3B",
    "SS",
    "OF",
    "OF",
    "OF",
    "Util",
    "P",
    "P",
    "P",
    "P",
    "P",
    "P",
    "P",
    "BN",
    "BN",
    "BN",
  ]

  const CUSTOM_ROSTER: string[] = [
    "C",
    "1B",
    "2B",
    "3B",
    "SS",
    "OF",
    "OF",
    "OF",
    "Util",
    "P",
    "P",
    "P",
    "P",
    "P",
    "P",
    "P",
    "BN",
    "BN",
    "BN",
    "BN",
    "BN",
    "BN",
    "BN",
  ]

  const OTTONEU_ROSTER: string[] = [
    "C",
    "C",
    "1B",
    "2B",
    "3B",
    "SS",
    "MI",
    "OF",
    "OF",
    "OF",
    "OF",
    "OF",
    "Util",
    "P",
    "P",
    "P",
    "P",
    "P",
    "P",
    "P",
    "P",
    "P",
    ...Array<string>(17).fill("BN"),
  ]

  // Prisma enum names (TS values) differ from @map DB values
  type TemplateInput = {
    name: string
    platform: "ESPN" | "Ottoneu" | "Custom"
    playType: "H2H" | "Season"
    scoring: "FiveX5" | "FourX4" | "Fangraphs" | "SABR" | "Points"
    draftMode: "Live" | "Slow"
    draftType: "Snake" | "Auction"
    teams: number
    rosterSize: number
    cap: number | null
    rosters: string[]
    description: string
    rulesText: string
  }

  const templates: TemplateInput[] = [
    {
      name: "Custom",
      platform: "Custom",
      playType: "Season",
      scoring: "FiveX5",
      draftMode: "Live",
      draftType: "Snake",
      teams: 12,
      rosterSize: 23,
      cap: null,
      rosters: CUSTOM_ROSTER,
      description:
        "Fully customizable template — snake draft, 5×5 roto, season-long defaults",
      rulesText:
        "# Custom\n\nThis template provides minimal defaults. Customize all settings to fit your league's rules.",
    },
    {
      name: "ESPN H2H 5x5",
      platform: "ESPN",
      playType: "H2H",
      scoring: "FiveX5",
      draftMode: "Live",
      draftType: "Snake",
      teams: 12,
      rosterSize: 19,
      cap: null,
      rosters: ESPN_ROSTER,
      description:
        "ESPN snake draft, 5×5 rotisserie categories, head-to-head each category",
      rulesText:
        "# ESPN H2H 5x5\n\n**Scoring**: Head-to-head, 5×5 categories (HR, RBI, SB, AVG, R / W, SV, ERA, WHIP, K).\n\n**Draft**: Snake, live.\n\n**Playoffs**: Top teams advance to bracket.",
    },
    {
      name: "ESPN H2H Points",
      platform: "ESPN",
      playType: "H2H",
      scoring: "Points",
      draftMode: "Live",
      draftType: "Snake",
      teams: 12,
      rosterSize: 19,
      cap: null,
      rosters: ESPN_ROSTER,
      description: "ESPN snake draft, ESPN points scoring, head-to-head points",
      rulesText:
        "# ESPN H2H Points\n\n**Scoring**: Head-to-head total points each week. ESPN default point values.\n\n**Draft**: Snake, live.\n\n**Playoffs**: Top teams by W/L record advance to postseason.",
    },
    {
      name: "ESPN 5x5",
      platform: "ESPN",
      playType: "Season",
      scoring: "FiveX5",
      draftMode: "Live",
      draftType: "Snake",
      teams: 12,
      rosterSize: 19,
      cap: null,
      rosters: ESPN_ROSTER,
      description: "ESPN snake draft, 5×5 rotisserie scoring, season-long",
      rulesText:
        "# ESPN 5x5\n\n**Scoring**: Rotisserie 5×5 (HR, RBI, SB, AVG, R / W, SV, ERA, WHIP, K).\n\n**Draft**: Snake, live.\n\n**Season long**: Cumulative roto standings, no playoffs.",
    },
    {
      name: "ESPN Points",
      platform: "ESPN",
      playType: "Season",
      scoring: "Points",
      draftMode: "Live",
      draftType: "Snake",
      teams: 12,
      rosterSize: 19,
      cap: null,
      rosters: ESPN_ROSTER,
      description: "ESPN snake draft, ESPN points scoring, season-long",
      rulesText:
        "# ESPN Points\n\n**Scoring**: ESPN default points. Batters earn points per counting stat; pitchers earn for Ks and wins.\n\n**Draft**: Snake, live.\n\n**Season long**: Cumulative total points, no playoffs.",
    },
    {
      name: "Ottoneu 4x4",
      platform: "Ottoneu",
      playType: "Season",
      scoring: "FourX4",
      draftMode: "Slow",
      draftType: "Auction",
      teams: 12,
      rosterSize: 40,
      cap: 400,
      rosters: OTTONEU_ROSTER,
      description: "Ottoneu auction, 4×4 rotisserie scoring, season-long",
      rulesText:
        "# Ottoneu 4x4\n\n**Scoring**: Rotisserie 4×4 (HR, RBI, SB, AVG / W, SV, ERA, WHIP).\n\n**Format**: 12-team auction, $400 cap, 40-man rosters.\n\n**Season long**: No playoffs. Cumulative roto standings.\n\n**Keeper contracts**: Salary escalates $5/year.",
    },
    {
      name: "Ottoneu 5x5",
      platform: "Ottoneu",
      playType: "Season",
      scoring: "FiveX5",
      draftMode: "Slow",
      draftType: "Auction",
      teams: 12,
      rosterSize: 40,
      cap: 400,
      rosters: OTTONEU_ROSTER,
      description: "Ottoneu auction, 5×5 rotisserie scoring, season-long",
      rulesText:
        "# Ottoneu 5x5\n\n**Scoring**: Rotisserie 5×5 (HR, RBI, SB, AVG, R / W, SV, ERA, WHIP, K).\n\n**Format**: 12-team auction, $400 cap, 40-man rosters.\n\n**Season long**: No playoffs. Cumulative roto standings.\n\n**Keeper contracts**: Salary escalates $5/year.",
    },
    {
      name: "Ottoneu FGPTs",
      platform: "Ottoneu",
      playType: "Season",
      scoring: "Fangraphs",
      draftMode: "Slow",
      draftType: "Auction",
      teams: 12,
      rosterSize: 40,
      cap: 400,
      rosters: OTTONEU_ROSTER,
      description:
        "Ottoneu auction, FanGraphs linear-weights points, season-long",
      rulesText:
        "# Ottoneu FGPTs\n\n**Scoring**: FanGraphs linear-weights points. Batters on wOBA components; pitchers on outs, Ks, penalized for walks/HRs.\n\n**Format**: 12-team auction, $400 cap, 40-man rosters.\n\n**Season long**: Total cumulative points.\n\n**Keeper contracts**: Salary escalates $5/year.",
    },
    {
      name: "Ottoneu SABR",
      platform: "Ottoneu",
      playType: "Season",
      scoring: "SABR",
      draftMode: "Slow",
      draftType: "Auction",
      teams: 12,
      rosterSize: 40,
      cap: 400,
      rosters: OTTONEU_ROSTER,
      description: "Ottoneu auction, SABR linear-weights points, season-long",
      rulesText:
        "# Ottoneu SABR\n\n**Scoring**: SABR-derived linear-weights points. Batters on on-base/extra-base value; pitchers on peripherals (Ks, BB, HR).\n\n**Format**: 12-team auction, $400 cap, 40-man rosters.\n\n**Season long**: Total cumulative points.\n\n**Keeper contracts**: Salary escalates $5/year.",
    },
    {
      name: "Ottoneu H2H FGPTs",
      platform: "Ottoneu",
      playType: "H2H",
      scoring: "Fangraphs",
      draftMode: "Slow",
      draftType: "Auction",
      teams: 12,
      rosterSize: 40,
      cap: 400,
      rosters: OTTONEU_ROSTER,
      description:
        "Ottoneu auction, FanGraphs points scoring, head-to-head points",
      rulesText:
        "# Ottoneu H2H FGPTs\n\n**Scoring**: Head-to-head total points. FanGraphs linear-weights scoring.\n\n**Format**: 12-team auction, $400 cap, 40-man rosters.\n\n**Playoffs**: Top teams by points advance to bracket.\n\n**Keeper contracts**: Salary escalates $5/year.",
    },
    {
      name: "Ottoneu H2H SABR",
      platform: "Ottoneu",
      playType: "H2H",
      scoring: "SABR",
      draftMode: "Slow",
      draftType: "Auction",
      teams: 12,
      rosterSize: 40,
      cap: 400,
      rosters: OTTONEU_ROSTER,
      description: "Ottoneu auction, SABR points scoring, head-to-head points",
      rulesText:
        "# Ottoneu H2H SABR\n\n**Scoring**: Head-to-head total points. SABR-derived linear-weights scoring.\n\n**Format**: 12-team auction, $400 cap, 40-man rosters.\n\n**Playoffs**: Top teams by points advance to bracket.\n\n**Keeper contracts**: Salary escalates $5/year.",
    },
  ]

  for (const t of templates) {
    await prisma.leagueTemplate.upsert({
      where: { name: t.name },
      update: {
        platform: t.platform,
        playType: t.playType,
        scoring: t.scoring,
        draftMode: t.draftMode,
        draftType: t.draftType,
        teams: t.teams,
        rosterSize: t.rosterSize,
        cap: t.cap,
        rosters: t.rosters,
        description: t.description,
        rulesText: t.rulesText,
      },
      create: {
        name: t.name,
        platform: t.platform,
        playType: t.playType,
        scoring: t.scoring,
        draftMode: t.draftMode,
        draftType: t.draftType,
        teams: t.teams,
        rosterSize: t.rosterSize,
        cap: t.cap,
        rosters: t.rosters,
        description: t.description,
        rulesText: t.rulesText,
      },
    })
  }
  process.stdout.write(`Seeded ${templates.length} league templates\n`)
}
