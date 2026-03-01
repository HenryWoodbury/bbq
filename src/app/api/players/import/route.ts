// TODO: Column mapping is placeholder — update to match the final CSV upload format
// once the SFBB-based player universe schema is settled (follow-on work).
import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { parsePositions } from "@/lib/positions";
import { parseCSVLine, chunk } from "@/lib/csv";

interface ParsedRow {
  sfbbId: string;
  playerName: string;
  fangraphsId: number | null;
  fangraphsMinorsId: string | null;
  mlbamId: number | null;
  birthday: Date | null;
  positions: string[];
}

interface RowError {
  row: number;
  field: string;
  message: string;
}

const BATCH_SIZE = 500;
const ERROR_LIMIT = 10;

export async function POST(request: NextRequest) {
  const denied = await assertAdmin();
  if (denied) return denied;

  try {
    const formData = await request.formData();
    const mode = formData.get("mode") === "additive" ? "additive" : "replace";
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const text = await (file as File).text();
    const lines = text.split("\n").map((l) => l.replace(/\r$/, "")).filter((l) => l.trim());

    if (lines.length < 2) {
      return NextResponse.json({ error: "CSV has no data rows" }, { status: 400 });
    }

    const headers = parseCSVLine(lines[0]);
    const colIdx = {
      sfbbId:    headers.indexOf("IDPLAYER"),
      playerName:headers.indexOf("PLAYERNAME"),
      fgId:      headers.indexOf("IDFANGRAPHS"),
      fgMinorId: headers.indexOf("FANGRAPHSMINORSID"),
      mlbamId:   headers.indexOf("MLBID"),
      birthday:  headers.indexOf("BIRTHDATE"),
      positions: headers.indexOf("POS"),
    };

    if (colIdx.sfbbId === -1 || colIdx.playerName === -1) {
      return NextResponse.json(
        { error: `Missing required columns. Expected "IDPLAYER" and "PLAYERNAME". Found: ${headers.slice(0, 10).join(", ")}` },
        { status: 400 }
      );
    }

    const errors: RowError[] = [];
    let errorCount = 0;
    const rows: ParsedRow[] = [];

    function addError(err: RowError) {
      errorCount++;
      if (errors.length < ERROR_LIMIT) errors.push(err);
    }

    for (let i = 1; i < lines.length; i++) {
      const rowNum = i;
      const fields = parseCSVLine(lines[i]);

      const rawSfbbId   = colIdx.sfbbId    !== -1 ? (fields[colIdx.sfbbId]    ?? "").trim() : "";
      const rawName     = colIdx.playerName !== -1 ? (fields[colIdx.playerName]?? "").trim() : "";
      const rawFgId     = colIdx.fgId      !== -1 ? (fields[colIdx.fgId]      ?? "").trim() : "";
      const rawFgMinorId= colIdx.fgMinorId !== -1 ? (fields[colIdx.fgMinorId] ?? "").trim() : "";
      const rawMlbamId  = colIdx.mlbamId   !== -1 ? (fields[colIdx.mlbamId]   ?? "").trim() : "";
      const rawBirthday = colIdx.birthday  !== -1 ? (fields[colIdx.birthday]  ?? "").trim() : "";
      const rawPositions= colIdx.positions !== -1 ? (fields[colIdx.positions] ?? "").trim() : "";

      if (!rawSfbbId) addError({ row: rowNum, field: "PLAYERID", message: "Required" });
      if (!rawName)   addError({ row: rowNum, field: "PLAYERNAME", message: "Required" });

      let fangraphsId: number | null = null;
      if (rawFgId) {
        const n = parseInt(rawFgId, 10);
        if (isNaN(n)) addError({ row: rowNum, field: "IDFANGRAPHS", message: "Must be an integer" });
        else fangraphsId = n;
      }

      let mlbamId: number | null = null;
      if (rawMlbamId) {
        const n = parseInt(rawMlbamId, 10);
        if (isNaN(n)) addError({ row: rowNum, field: "MLBID", message: "Must be an integer" });
        else mlbamId = n;
      }

      let birthday: Date | null = null;
      if (rawBirthday) {
        const d = new Date(rawBirthday);
        if (isNaN(d.getTime())) addError({ row: rowNum, field: "BIRTHDATE", message: "Invalid date" });
        else birthday = d;
      }

      rows.push({
        sfbbId: rawSfbbId,
        playerName: rawName,
        fangraphsId,
        fangraphsMinorsId: rawFgMinorId || null,
        mlbamId,
        birthday,
        positions: parsePositions(rawPositions),
      });
    }

    if (errorCount > 0) {
      return NextResponse.json({ errorCount, errors }, { status: 422 });
    }

    const existingIds = new Set(
      (
        await prisma.player.findMany({
          where: { sfbbId: { in: rows.map((r) => r.sfbbId) } },
          select: { sfbbId: true },
        })
      ).map((p) => p.sfbbId)
    );

    const inserted = rows.filter((r) => !existingIds.has(r.sfbbId)).length;
    const updated = rows.length - inserted;

    for (const batch of chunk(rows, BATCH_SIZE)) {
      await prisma.$transaction(
        batch.map((row) =>
          prisma.player.upsert({
            where: { sfbbId: row.sfbbId },
            create: {
              sfbbId:            row.sfbbId,
              playerName:        row.playerName,
              fangraphsId:       row.fangraphsId,
              fangraphsMinorsId: row.fangraphsMinorsId,
              mlbamId:           row.mlbamId,
              birthday:          row.birthday,
              positions:         row.positions,
            },
            update: {
              playerName:        row.playerName,
              fangraphsId:       row.fangraphsId,
              fangraphsMinorsId: row.fangraphsMinorsId,
              mlbamId:           row.mlbamId,
              birthday:          row.birthday,
              positions:         row.positions,
              deletedAt:         null,
            },
          })
        )
      );
    }

    let deleted = 0;
    if (mode === "replace") {
      const uploadedIds = rows.map((r) => r.sfbbId);
      const { count } = await prisma.player.updateMany({
        where: { sfbbId: { notIn: uploadedIds }, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      deleted = count;
    }

    const importedAt = new Date().toISOString();
    return NextResponse.json({ total: rows.length, inserted, updated, deleted, importedAt });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[import] POST error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
