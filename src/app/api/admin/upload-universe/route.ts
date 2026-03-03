import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { parsePositions } from "@/lib/positions";
import { parseCSVLine, chunk } from "@/lib/csv";
import { reconcilePlayerIds } from "@/lib/reconcile-player-ids";

const BATCH_SIZE = 500;

// Ottoneu Player Universe CSV column header names
const COL = {
  ottoneuId:  "Ottoneu ID",
  playerName: "Name",
  fgId:       "FG ID",
  fgMinorId:  "FG Minor ID",
  mlbamId:    "MLBAM ID",
  birthday:   "Birthday",
  positions:  "Ottoneu Positions",
} as const;

interface ParsedRow {
  ottoneuId:   number;
  playerName:  string;
  fangraphsId: string | null;
  mlbamId:     number | null;
  birthday:    Date | null;
  positions:   string[];
}

function toInt(raw: string): number | null {
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return isNaN(n) ? null : n;
}

export async function POST(request: NextRequest) {
  const denied = await assertAdmin();
  if (denied) return denied;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file field" }, { status: 422 });
  }

  const mode = formData.get("mode") === "additive" ? "additive" : "replace";
  const text = await file.text();

  const lines = text.split("\n").map((l) => l.replace(/\r$/, "")).filter((l) => l.trim());
  if (lines.length < 2) {
    return NextResponse.json({ error: "CSV has no data rows" }, { status: 422 });
  }

  const headers = parseCSVLine(lines[0]);
  const idx = Object.fromEntries(
    Object.entries(COL).map(([key, col]) => [key, headers.indexOf(col)])
  ) as Record<keyof typeof COL, number>;

  if (idx.ottoneuId === -1 || idx.playerName === -1) {
    const missing = (Object.entries(COL) as [keyof typeof COL, string][])
      .filter(([key]) => idx[key] === -1 && (key === "ottoneuId" || key === "playerName"))
      .map(([, col]) => col)
      .join(", ");
    return NextResponse.json(
      { error: `Missing required columns: ${missing}. Found: ${headers.slice(0, 10).join(", ")}` },
      { status: 422 }
    );
  }

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    const get = (key: keyof typeof COL) =>
      idx[key] !== -1 ? (fields[idx[key]] ?? "").trim() : "";

    const rawId = get("ottoneuId");
    const rawName = get("playerName");
    if (!rawId || !rawName) continue;

    const id = toInt(rawId);
    if (id === null) continue;

    const rawFgId = get("fgId");
    const rawFgMinorId = get("fgMinorId");

    const rawBirthday = get("birthday");
    const birthday = rawBirthday ? (() => { const d = new Date(rawBirthday); return isNaN(d.getTime()) ? null : d; })() : null;

    rows.push({
      ottoneuId:   id,
      playerName:  rawName,
      fangraphsId: rawFgId || rawFgMinorId || null,
      mlbamId:     toInt(get("mlbamId")),
      birthday,
      positions:   parsePositions(get("positions")),
    });
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "No valid rows parsed from CSV" }, { status: 422 });
  }

  const uploadedOttoneuIds = rows.map((r) => r.ottoneuId);

  // Link to canonical Player by ottoneuId
  const matchedPlayers = await prisma.player.findMany({
    where: { ottoneuId: { in: uploadedOttoneuIds } },
    select: { id: true, ottoneuId: true },
  });
  const playerIdByOttoneuId = new Map(
    matchedPlayers.map((p) => [p.ottoneuId!, p.id])
  );

  // Count inserts vs updates
  const existingRows = await prisma.playerUniverse.findMany({
    where: { format: "ottoneu", ottoneuId: { in: uploadedOttoneuIds } },
    select: { ottoneuId: true },
  });
  const existingOttoneuIds = new Set(existingRows.map((r) => r.ottoneuId));
  const inserted = rows.filter((r) => !existingOttoneuIds.has(r.ottoneuId)).length;
  const updated = rows.length - inserted;

  for (const batch of chunk(rows, BATCH_SIZE)) {
    await prisma.$transaction(
      batch.map((row) =>
        prisma.playerUniverse.upsert({
          where: { format_ottoneuId: { format: "ottoneu", ottoneuId: row.ottoneuId } },
          create: {
            format:      "ottoneu",
            ottoneuId:   row.ottoneuId,
            playerName:  row.playerName,
            fangraphsId: row.fangraphsId,
            mlbamId:     row.mlbamId,
            birthday:    row.birthday,
            positions:   row.positions,
            playerId:    playerIdByOttoneuId.get(row.ottoneuId) ?? null,
          },
          update: {
            playerName:  row.playerName,
            fangraphsId: row.fangraphsId,
            mlbamId:     row.mlbamId,
            birthday:    row.birthday,
            positions:   row.positions,
            playerId:    playerIdByOttoneuId.get(row.ottoneuId) ?? null,
            deletedAt:   null,
          },
        })
      )
    );
  }

  let deleted = 0;
  if (mode === "replace") {
    const { count } = await prisma.playerUniverse.updateMany({
      where: {
        format: "ottoneu",
        ottoneuId: { notIn: uploadedOttoneuIds },
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
    });
    deleted = count;
  }

  const { linked, ottoneuIdsFilled, manualOverridesLinked } = await reconcilePlayerIds();

  const uploadedAt = new Date().toISOString();
  return NextResponse.json({ total: rows.length, inserted, updated, deleted, linked, ottoneuIdsFilled, manualOverridesLinked, uploadedAt });
}
