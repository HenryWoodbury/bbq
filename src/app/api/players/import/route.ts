import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { parsePositions } from "@/lib/positions";

interface ParsedRow {
  playerId: string;
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

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

const BATCH_SIZE = 500;
const ERROR_LIMIT = 10;

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

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
      playerId: headers.indexOf("Ottoneu ID"),
      playerName: headers.indexOf("Name"),
      fgId: headers.indexOf("FG ID"),
      fgMinorId: headers.indexOf("FG Minor ID"),
      mlbamId: headers.indexOf("MLBAM ID"),
      birthday: headers.indexOf("Birthday"),
      positions: headers.indexOf("Ottoneu Positions"),
    };

    if (colIdx.playerId === -1 || colIdx.playerName === -1) {
      return NextResponse.json(
        { error: `Missing required columns. Expected "Ottoneu ID" and "Name".` },
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

      const rawPlayerId = colIdx.playerId !== -1 ? (fields[colIdx.playerId] ?? "").trim() : "";
      const rawName = colIdx.playerName !== -1 ? (fields[colIdx.playerName] ?? "").trim() : "";
      const rawFgId = colIdx.fgId !== -1 ? (fields[colIdx.fgId] ?? "").trim() : "";
      const rawFgMinorId = colIdx.fgMinorId !== -1 ? (fields[colIdx.fgMinorId] ?? "").trim() : "";
      const rawMlbamId = colIdx.mlbamId !== -1 ? (fields[colIdx.mlbamId] ?? "").trim() : "";
      const rawBirthday = colIdx.birthday !== -1 ? (fields[colIdx.birthday] ?? "").trim() : "";
      const rawPositions = colIdx.positions !== -1 ? (fields[colIdx.positions] ?? "").trim() : "";

      if (!rawPlayerId) addError({ row: rowNum, field: "Ottoneu ID", message: "Required" });
      if (!rawName) addError({ row: rowNum, field: "Name", message: "Required" });

      let fangraphsId: number | null = null;
      if (rawFgId) {
        const n = parseInt(rawFgId, 10);
        if (isNaN(n)) addError({ row: rowNum, field: "FG ID", message: "Must be an integer" });
        else fangraphsId = n;
      }

      let mlbamId: number | null = null;
      if (rawMlbamId) {
        const n = parseInt(rawMlbamId, 10);
        if (isNaN(n)) addError({ row: rowNum, field: "MLBAM ID", message: "Must be an integer" });
        else mlbamId = n;
      }

      let birthday: Date | null = null;
      if (rawBirthday) {
        const d = new Date(rawBirthday);
        if (isNaN(d.getTime())) addError({ row: rowNum, field: "Birthday", message: "Invalid date" });
        else birthday = d;
      }

      rows.push({
        playerId: rawPlayerId,
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
          where: { playerId: { in: rows.map((r) => r.playerId) } },
          select: { playerId: true },
        })
      ).map((p) => p.playerId)
    );

    const inserted = rows.filter((r) => !existingIds.has(r.playerId)).length;
    const updated = rows.length - inserted;

    for (const batch of chunk(rows, BATCH_SIZE)) {
      await prisma.$transaction(
        batch.map((row) =>
          prisma.player.upsert({
            where: { playerId: row.playerId },
            create: {
              playerId: row.playerId,
              playerName: row.playerName,
              fangraphsId: row.fangraphsId,
              fangraphsMinorsId: row.fangraphsMinorsId,
              mlbamId: row.mlbamId,
              birthday: row.birthday,
              positions: row.positions,
            },
            update: {
              playerName: row.playerName,
              fangraphsId: row.fangraphsId,
              fangraphsMinorsId: row.fangraphsMinorsId,
              mlbamId: row.mlbamId,
              birthday: row.birthday,
              positions: row.positions,
              deletedAt: null,
            },
          })
        )
      );
    }

    let deleted = 0;
    if (mode === "replace") {
      const uploadedIds = rows.map((r) => r.playerId);
      const { count } = await prisma.player.updateMany({
        where: { playerId: { notIn: uploadedIds }, deletedAt: null },
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
