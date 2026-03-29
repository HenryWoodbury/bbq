import { type NextRequest, NextResponse } from "next/server"
import { assertAdmin } from "@/lib/auth-helpers"
import { chunk, parseCSVLine } from "@/lib/csv"
import { parsePositions } from "@/lib/positions"
import { prisma } from "@/lib/prisma"

interface ParsedRow {
  sfbbId: string
  playerName: string
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
}

interface RowError {
  row: number
  field: string
  message: string
}

const BATCH_SIZE = 500
const ERROR_LIMIT = 10

export async function POST(request: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied

  try {
    const formData = await request.formData()
    const mode = formData.get("mode") === "additive" ? "additive" : "replace"
    const file = formData.get("file")
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    const text = await (file as File).text()
    const lines = text
      .split("\n")
      .map((l) => l.replace(/\r$/, ""))
      .filter((l) => l.trim())

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV has no data rows" },
        { status: 400 },
      )
    }

    const headers = parseCSVLine(lines[0])
    const colIdx = {
      sfbbId: headers.indexOf("IDPLAYER"),
      playerName: headers.indexOf("PLAYERNAME"),
      birthday: headers.indexOf("BIRTHDATE"),
      firstName: headers.indexOf("FIRSTNAME"),
      lastName: headers.indexOf("LASTNAME"),
      positions: headers.indexOf("POS"),
      team: headers.indexOf("TEAM"),
      mlbLevel: headers.indexOf("LG"),
      active: headers.indexOf("ACTIVE"),
      bats: headers.indexOf("BATS"),
      throws: headers.indexOf("THROWS"),
      mlbamId: headers.indexOf("MLBID"),
      fgId: headers.indexOf("IDFANGRAPHS"),
      cbsId: headers.indexOf("CBSID"),
      espnId: headers.indexOf("ESPNID"),
      yahooId: headers.indexOf("YAHOOID"),
      fantraxId: headers.indexOf("FANTRAXID"),
      retroId: headers.indexOf("RETROID"),
      nfbcId: headers.indexOf("NFBCID"),
      bRefId: headers.indexOf("BREFID"),
    }

    if (colIdx.sfbbId === -1 || colIdx.playerName === -1) {
      return NextResponse.json(
        {
          error: `Missing required columns. Expected "IDPLAYER" and "PLAYERNAME". Found: ${headers.slice(0, 10).join(", ")}`,
        },
        { status: 400 },
      )
    }

    const errors: RowError[] = []
    let errorCount = 0
    const rows: ParsedRow[] = []

    function addError(err: RowError) {
      errorCount++
      if (errors.length < ERROR_LIMIT) errors.push(err)
    }

    for (let i = 1; i < lines.length; i++) {
      const rowNum = i
      const fields = parseCSVLine(lines[i])

      const get = (key: keyof typeof colIdx) =>
        colIdx[key] !== -1 ? (fields[colIdx[key]] ?? "").trim() : ""

      const rawSfbbId = get("sfbbId")
      const rawName = get("playerName")

      if (!rawSfbbId)
        addError({ row: rowNum, field: "IDPLAYER", message: "Required" })
      if (!rawName)
        addError({ row: rowNum, field: "PLAYERNAME", message: "Required" })

      const toInt = (raw: string): number | null => {
        if (!raw) return null
        const n = parseInt(raw, 10)
        return Number.isNaN(n) ? null : n
      }

      const rawFgId = get("fgId")
      const fangraphsId: string | null = rawFgId || null

      const rawMlbamId = get("mlbamId")
      let mlbamId: number | null = null
      if (rawMlbamId) {
        const n = parseInt(rawMlbamId, 10)
        if (Number.isNaN(n))
          addError({
            row: rowNum,
            field: "MLBID",
            message: "Must be an integer",
          })
        else mlbamId = n
      }

      const rawBirthday = get("birthday")
      let birthday: Date | null = null
      if (rawBirthday) {
        const d = new Date(rawBirthday)
        if (Number.isNaN(d.getTime()))
          addError({ row: rowNum, field: "BIRTHDATE", message: "Invalid date" })
        else birthday = d
      }

      rows.push({
        sfbbId: rawSfbbId,
        playerName: rawName,
        firstName: get("firstName") || null,
        lastName: get("lastName") || null,
        positions: parsePositions(get("positions")),
        team: get("team") || null,
        mlbLevel: get("mlbLevel") || null,
        active: get("active").toUpperCase() !== "N",
        birthday,
        bats: get("bats") || null,
        throws: get("throws") || null,
        mlbamId,
        fangraphsId,
        cbsId: toInt(get("cbsId")),
        espnId: toInt(get("espnId")),
        yahooId: toInt(get("yahooId")),
        fantraxId: get("fantraxId") || null,
        retroId: get("retroId") || null,
        nfbcId: toInt(get("nfbcId")),
        bRefId: get("bRefId") || null,
      })
    }

    if (errorCount > 0) {
      return NextResponse.json({ errorCount, errors }, { status: 422 })
    }

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

    for (const batch of chunk(rows, BATCH_SIZE)) {
      await prisma.$transaction(
        batch.map((row) =>
          prisma.player.upsert({
            where: { sfbbId: row.sfbbId },
            create: {
              sfbbId: row.sfbbId,
              playerName: row.playerName,
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
            },
            update: {
              playerName: row.playerName,
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
              deletedAt: null,
            },
          }),
        ),
      )
    }

    let deleted = 0
    if (mode === "replace") {
      const uploadedIds = rows.map((r) => r.sfbbId)
      const { count } = await prisma.player.updateMany({
        where: { sfbbId: { notIn: uploadedIds }, deletedAt: null },
        data: { deletedAt: new Date() },
      })
      deleted = count
    }

    await prisma.playerMapImport.create({
      data: { total: rows.length, inserted, updated, deleted },
    })

    const importedAt = new Date().toISOString()
    return NextResponse.json({
      total: rows.length,
      inserted,
      updated,
      deleted,
      importedAt,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
