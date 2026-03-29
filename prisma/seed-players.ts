/**
 * Seed Players and PlayerUniverse from local CSV files.
 *
 * Usage:
 *   pnpm seed:players
 *   pnpm seed:players sources/PLAYERIDMAP.csv sources/player_universe_2025.csv
 *
 * Defaults:
 *   PLAYERIDMAP  — first match of sources/PLAYERIDMAP*.csv
 *   Universe     — first match of sources/player_universe_*.csv
 *
 * Behavior mirrors the /api/admin/sync-players and /api/admin/upload-universe
 * routes (upsert + soft-delete orphans + reconcile).
 */

import "dotenv/config"
import { readdirSync, readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"
import { reconcilePlayerIds } from "../src/lib/reconcile-player-ids"

// ── Prisma ────────────────────────────────────────────────────────────────────
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

// ── Inline utilities (avoids @/ alias issues in tsx seed context) ─────────────
function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let current = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else inQuotes = !inQuotes
    } else if (ch === "," && !inQuotes) {
      fields.push(current)
      current = ""
    } else {
      current += ch
    }
  }
  fields.push(current)
  return fields
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

function parsePositions(raw: string): string[] {
  return raw
    .split(/[\s/,\t]+/)
    .map((p) => p.trim())
    .filter(Boolean)
}

function toInt(raw: string): number | null {
  if (!raw) return null
  const n = parseInt(raw, 10)
  return Number.isNaN(n) ? null : n
}

// ── File resolution ───────────────────────────────────────────────────────────
const ROOT = resolve(__dirname, "..")

function resolveGlob(dir: string, prefix: string): string {
  const files = readdirSync(dir).filter(
    (f) => f.startsWith(prefix) && f.endsWith(".csv"),
  )
  if (files.length === 0)
    throw new Error(`No file matching ${prefix}*.csv in ${dir}`)
  return join(dir, files[0])
}

function resolvePaths(args: string[]): {
  idmapPath: string
  universePath: string
} {
  if (args.length >= 2) {
    return { idmapPath: resolve(args[0]), universePath: resolve(args[1]) }
  }
  const sourceDir = join(ROOT, "sources")
  return {
    idmapPath: resolveGlob(sourceDir, "PLAYERIDMAP"),
    universePath: resolveGlob(sourceDir, "player_universe_"),
  }
}

// ── PLAYERIDMAP → Player ──────────────────────────────────────────────────────
const IDMAP_COL = {
  sfbbId: "IDPLAYER",
  playerName: "PLAYERNAME",
  fgSpecialChar: "FGSPECIALCHAR",
  birthday: "BIRTHDATE",
  firstName: "FIRSTNAME",
  lastName: "LASTNAME",
  position: "POS",
  team: "TEAM",
  mlbLevel: "LG",
  active: "ACTIVE",
  bats: "BATS",
  throws: "THROWS",
  mlbId: "MLBID",
  fgId: "IDFANGRAPHS",
  cbsId: "CBSID",
  espnId: "ESPNID",
  yahooId: "YAHOOID",
  fantraxId: "FANTRAXID",
  retroId: "RETROID",
  nfbcId: "NFBCID",
  bRefId: "BREFID",
  ottoneuId: "OTTONEUID",
} as const

async function seedPlayers(
  csvPath: string,
): Promise<{ inserted: number; updated: number; deleted: number }> {
  process.stdout.write(`Reading PLAYERIDMAP from ${csvPath}\n`)
  const text = readFileSync(csvPath, "utf8")

  const lines = text
    .split("\n")
    .map((l) => l.replace(/\r$/, ""))
    .filter((l) => l.trim())
  if (lines.length < 2) throw new Error("PLAYERIDMAP CSV has no data rows")

  const headers = parseCSVLine(lines[0])
  const idx = Object.fromEntries(
    Object.entries(IDMAP_COL).map(([key, col]) => [key, headers.indexOf(col)]),
  ) as Record<keyof typeof IDMAP_COL, number>

  if (idx.sfbbId === -1 || idx.playerName === -1) {
    throw new Error(
      `Missing required columns IDPLAYER/PLAYERNAME. Found: ${headers.slice(0, 15).join(", ")}`,
    )
  }

  type Row = {
    sfbbId: string
    playerName: string
    fgSpecialChar: string | null
    firstName: string | null
    lastName: string | null
    positions: string[]
    team: string | null
    mlbLevel: string | null
    active: boolean
    birthday: Date | null
    bats: string | null
    throws: string | null
    mlbamId: number | null
    fangraphsId: string | null
    cbsId: number | null
    espnId: number | null
    yahooId: number | null
    fantraxId: string | null
    retroId: string | null
    nfbcId: number | null
    bRefId: string | null
    ottoneuId: number | null
  }

  const rows: Row[] = []
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i])
    const get = (key: keyof typeof IDMAP_COL) =>
      idx[key] !== -1 ? (fields[idx[key]] ?? "").trim() : ""

    const rawId = get("sfbbId")
    const rawName = get("playerName")
    if (!rawId || !rawName) continue

    const rawBirthday = get("birthday")
    const birthday = rawBirthday
      ? (() => {
          const d = new Date(rawBirthday)
          return Number.isNaN(d.getTime()) ? null : d
        })()
      : null

    rows.push({
      sfbbId: rawId,
      playerName: rawName,
      fgSpecialChar: get("fgSpecialChar") || null,
      firstName: get("firstName") || null,
      lastName: get("lastName") || null,
      positions: parsePositions(get("position")),
      team: get("team") || null,
      mlbLevel: get("mlbLevel") || null,
      active: get("active").toUpperCase() !== "N",
      birthday,
      bats: get("bats") || null,
      throws: get("throws") || null,
      mlbamId: toInt(get("mlbId")),
      fangraphsId: get("fgId") || null,
      cbsId: toInt(get("cbsId")),
      espnId: toInt(get("espnId")),
      yahooId: toInt(get("yahooId")),
      fantraxId: get("fantraxId") || null,
      retroId: get("retroId") || null,
      nfbcId: toInt(get("nfbcId")),
      bRefId: get("bRefId") || null,
      ottoneuId: toInt(get("ottoneuId")),
    })
  }

  if (rows.length === 0)
    throw new Error("No valid rows parsed from PLAYERIDMAP CSV")
  process.stdout.write(`  Parsed ${rows.length.toLocaleString()} rows\n`)

  const existingIds = new Set(
    (
      await prisma.player.findMany({
        where: { sfbbId: { in: rows.map((r) => r.sfbbId) } },
        select: { sfbbId: true },
      })
    ).map((p) => p.sfbbId),
  )

  const inserted = rows.filter((r) => !existingIds.has(r.sfbbId)).length
  const updated = rows.length - inserted

  const BATCH = 500
  let done = 0
  for (const batch of chunk(rows, BATCH)) {
    await prisma.$transaction(
      batch.map((row) =>
        prisma.player.upsert({
          where: { sfbbId: row.sfbbId },
          create: {
            sfbbId: row.sfbbId,
            playerName: row.playerName,
            fgSpecialChar: row.fgSpecialChar,
            firstName: row.firstName,
            lastName: row.lastName,
            positions: row.positions,
            team: row.team,
            mlbLevel: row.mlbLevel,
            active: row.active,
            birthday: row.birthday,
            bats: row.bats,
            throws: row.throws,
            mlbamId: row.mlbamId,
            fangraphsId: row.fangraphsId,
            cbsId: row.cbsId,
            espnId: row.espnId,
            yahooId: row.yahooId,
            fantraxId: row.fantraxId,
            retroId: row.retroId,
            nfbcId: row.nfbcId,
            bRefId: row.bRefId,
            ottoneuId: row.ottoneuId,
          },
          update: {
            playerName: row.playerName,
            fgSpecialChar: row.fgSpecialChar,
            firstName: row.firstName,
            lastName: row.lastName,
            positions: row.positions,
            team: row.team,
            mlbLevel: row.mlbLevel,
            active: row.active,
            birthday: row.birthday,
            bats: row.bats,
            throws: row.throws,
            mlbamId: row.mlbamId,
            fangraphsId: row.fangraphsId,
            cbsId: row.cbsId,
            espnId: row.espnId,
            yahooId: row.yahooId,
            fantraxId: row.fantraxId,
            retroId: row.retroId,
            nfbcId: row.nfbcId,
            bRefId: row.bRefId,
            ottoneuId: row.ottoneuId,
            deletedAt: null,
          },
        }),
      ),
    )
    done += batch.length
    process.stdout.write(
      `  ${done.toLocaleString()} / ${rows.length.toLocaleString()}\r`,
    )
  }
  process.stdout.write("\n")

  const uploadedSfbbIds = rows.map((r) => r.sfbbId)
  const { count: deleted } = await prisma.player.updateMany({
    where: { sfbbId: { notIn: uploadedSfbbIds }, deletedAt: null },
    data: { deletedAt: new Date() },
  })

  return { inserted, updated, deleted }
}

// ── Player Universe CSV → PlayerUniverse ──────────────────────────────────────
const UNIVERSE_COL = {
  ottoneuId: "Ottoneu ID",
  playerName: "Name",
  fgId: "FG ID",
  fgMinorId: "FG Minor ID",
  mlbamId: "MLBAM ID",
  birthday: "Birthday",
  positions: "Ottoneu Positions",
} as const

async function seedUniverse(
  csvPath: string,
): Promise<{ inserted: number; updated: number; deleted: number }> {
  process.stdout.write(`Reading Player Universe from ${csvPath}\n`)
  const text = readFileSync(csvPath, "utf8")

  const lines = text
    .split("\n")
    .map((l) => l.replace(/\r$/, ""))
    .filter((l) => l.trim())
  if (lines.length < 2) throw new Error("Player Universe CSV has no data rows")

  const headers = parseCSVLine(lines[0])
  const idx = Object.fromEntries(
    Object.entries(UNIVERSE_COL).map(([key, col]) => [
      key,
      headers.indexOf(col),
    ]),
  ) as Record<keyof typeof UNIVERSE_COL, number>

  if (idx.ottoneuId === -1 || idx.playerName === -1) {
    throw new Error(
      `Missing required columns. Found: ${headers.slice(0, 10).join(", ")}`,
    )
  }

  type Row = {
    ottoneuId: number
    playerName: string
    fangraphsId: string | null
    mlbamId: number | null
    birthday: Date | null
    positions: string[]
  }

  const rows: Row[] = []
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i])
    const get = (key: keyof typeof UNIVERSE_COL) =>
      idx[key] !== -1 ? (fields[idx[key]] ?? "").trim() : ""

    const rawId = get("ottoneuId")
    const rawName = get("playerName")
    if (!rawId || !rawName) continue

    const id = toInt(rawId)
    if (id === null) continue

    const rawBirthday = get("birthday")
    const birthday = rawBirthday
      ? (() => {
          const d = new Date(rawBirthday)
          return Number.isNaN(d.getTime()) ? null : d
        })()
      : null

    rows.push({
      ottoneuId: id,
      playerName: rawName,
      fangraphsId: get("fgId") || get("fgMinorId") || null,
      mlbamId: toInt(get("mlbamId")),
      birthday,
      positions: parsePositions(get("positions")),
    })
  }

  if (rows.length === 0)
    throw new Error("No valid rows parsed from Player Universe CSV")
  process.stdout.write(`  Parsed ${rows.length.toLocaleString()} rows\n`)

  const uploadedOttoneuIds = rows.map((r) => r.ottoneuId)

  const matchedPlayers = await prisma.player.findMany({
    where: { ottoneuId: { in: uploadedOttoneuIds } },
    select: { id: true, ottoneuId: true },
  })
  const playerIdByOttoneuId = new Map(
    matchedPlayers.map((p) => [p.ottoneuId, p.id]),
  )

  const existingRows = await prisma.playerUniverse.findMany({
    where: { format: "ottoneu", ottoneuId: { in: uploadedOttoneuIds } },
    select: { ottoneuId: true },
  })
  const existingOttoneuIds = new Set(existingRows.map((r) => r.ottoneuId))
  const inserted = rows.filter(
    (r) => !existingOttoneuIds.has(r.ottoneuId),
  ).length
  const updated = rows.length - inserted

  const BATCH = 500
  let done = 0
  for (const batch of chunk(rows, BATCH)) {
    await prisma.$transaction(
      batch.map((row) =>
        prisma.playerUniverse.upsert({
          where: {
            format_ottoneuId: { format: "ottoneu", ottoneuId: row.ottoneuId },
          },
          create: {
            format: "ottoneu",
            ottoneuId: row.ottoneuId,
            playerName: row.playerName,
            fangraphsId: row.fangraphsId,
            mlbamId: row.mlbamId,
            birthday: row.birthday,
            positions: row.positions,
            playerId: playerIdByOttoneuId.get(row.ottoneuId) ?? null,
          },
          update: {
            playerName: row.playerName,
            fangraphsId: row.fangraphsId,
            mlbamId: row.mlbamId,
            birthday: row.birthday,
            positions: row.positions,
            playerId: playerIdByOttoneuId.get(row.ottoneuId) ?? null,
            deletedAt: null,
          },
        }),
      ),
    )
    done += batch.length
    process.stdout.write(
      `  ${done.toLocaleString()} / ${rows.length.toLocaleString()}\r`,
    )
  }
  process.stdout.write("\n")

  const { count: deleted } = await prisma.playerUniverse.updateMany({
    where: {
      format: "ottoneu",
      ottoneuId: { notIn: uploadedOttoneuIds },
      deletedAt: null,
    },
    data: { deletedAt: new Date() },
  })

  return { inserted, updated, deleted }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2)

  let idmapPath: string
  let universePath: string
  try {
    ;({ idmapPath, universePath } = resolvePaths(args))
  } catch (err) {
    process.stderr.write(
      `${err instanceof Error ? err.message : String(err)}\n`,
    )
    process.stderr.write("Usage: pnpm seed:players [idmap.csv universe.csv]\n")
    process.exit(1)
  }

  // Players
  const players = await seedPlayers(idmapPath)
  process.stdout.write(
    `Players: ${players.inserted} inserted, ${players.updated} updated, ${players.deleted} soft-deleted\n`,
  )

  // Universe
  const universe = await seedUniverse(universePath)
  process.stdout.write(
    `Universe: ${universe.inserted} inserted, ${universe.updated} updated, ${universe.deleted} soft-deleted\n`,
  )

  // Reconcile
  process.stdout.write("Reconciling player IDs…\n")
  const { linked, ottoneuIdsFilled, manualOverridesLinked } =
    await reconcilePlayerIds()
  process.stdout.write(
    `Reconcile: ${linked} linked, ${ottoneuIdsFilled} ottoneuIds filled, ${manualOverridesLinked} overrides linked\n`,
  )
}

main()
  .catch((e) => {
    process.stderr.write(`${e}\n`)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
