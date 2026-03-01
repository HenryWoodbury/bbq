import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { parsePositions } from "@/lib/positions";
import { parseCSVLine, chunk } from "@/lib/csv";

const SFBB_URL = "https://www.smartfantasybaseball.com/PLAYERIDMAPCSV";
const BATCH_SIZE = 500;

// ── SFBB Player ID Map column header names ──────────────────────────────────
// Update these constants if SFBB renames columns in a future release.
// Actual column names are verified at runtime; a 422 with found headers is
// returned if required columns are missing.
const COL = {
  sfbbId:    "IDPLAYER",       // confirmed from live CSV
  playerName:"PLAYERNAME",
  birthday:  "BIRTHDATE",
  position:  "POS",
  team:      "TEAM",
  mlbLevel:  "LG",
  active:    "ACTIVE",
  // Cross-reference IDs
  mlbId:     "MLBID",
  fgId:      "IDFANGRAPHS",
  fgMinorsId:"FANGRAPHSMINORSID",
  cbsId:     "CBSID",
  espnId:    "ESPNID",
  yahooId:   "YAHOOID",
  fantraxId: "FANTRAXID",
  retroId:   "RETROID",
  nfbcId:    "NFBCID",
  bRefId:    "BREFID",
} as const;

interface ParsedRow {
  sfbbId: string;
  playerName: string;
  positions: string[];
  team: string | null;
  mlbLevel: string | null;
  active: boolean;
  birthday: Date | null;
  mlbamId: number | null;
  fangraphsId: number | null;
  fangraphsMinorsId: string | null;
  cbsId: number | null;
  espnId: number | null;
  yahooId: number | null;
  fantraxId: string | null;
  retroId: string | null;
  nfbcId: number | null;
  bRefId: string | null;
}

function toInt(raw: string): number | null {
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return isNaN(n) ? null : n;
}

export async function POST(request: NextRequest) {
  const denied = await assertAdmin();
  if (denied) return denied;

  const body = await request.json().catch(() => ({})) as { mode?: string };
  const mode = body.mode === "additive" ? "additive" : "replace";

  let text: string;
  try {
    const res = await fetch(SFBB_URL, {
      headers: { "User-Agent": "BBQ/1.0 (Fantasy Baseball Draft Manager)" },
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream fetch failed: ${res.status} ${res.statusText}` },
        { status: 502 }
      );
    }
    text = await res.text();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Fetch error: ${message}` }, { status: 502 });
  }

  const lines = text.split("\n").map((l) => l.replace(/\r$/, "")).filter((l) => l.trim());
  if (lines.length < 2) {
    return NextResponse.json({ error: "CSV has no data rows" }, { status: 422 });
  }

  const headers = parseCSVLine(lines[0]);
  const idx = Object.fromEntries(
    Object.entries(COL).map(([key, col]) => [key, headers.indexOf(col)])
  ) as Record<keyof typeof COL, number>;

  if (idx.sfbbId === -1 || idx.playerName === -1) {
    const missing = (Object.entries(COL) as [keyof typeof COL, string][])
      .filter(([key]) => (idx[key] === -1) && (key === "sfbbId" || key === "playerName"))
      .map(([, col]) => col)
      .join(", ");
    return NextResponse.json(
      { error: `Missing required columns: ${missing}. First 15 headers found: ${headers.slice(0, 15).join(", ")}` },
      { status: 422 }
    );
  }

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    const get = (key: keyof typeof COL) =>
      idx[key] !== -1 ? (fields[idx[key]] ?? "").trim() : "";

    const rawId = get("sfbbId");
    const rawName = get("playerName");
    if (!rawId || !rawName) continue;

    rows.push({
      sfbbId:            rawId,
      playerName:        rawName,
      positions:         parsePositions(get("position")),
      team:              get("team") || null,
      mlbLevel:          get("mlbLevel") || null,
      active:            get("active").toUpperCase() !== "N",
      birthday:          (() => { const d = new Date(get("birthday")); return isNaN(d.getTime()) ? null : d; })(),
      mlbamId:           toInt(get("mlbId")),
      fangraphsId:       toInt(get("fgId")),
      fangraphsMinorsId: get("fgMinorsId") || null,
      cbsId:             toInt(get("cbsId")),
      espnId:            toInt(get("espnId")),
      yahooId:           toInt(get("yahooId")),
      fantraxId:         get("fantraxId") || null,
      retroId:           get("retroId") || null,
      nfbcId:            toInt(get("nfbcId")),
      bRefId:            get("bRefId") || null,
    });
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "No valid rows parsed from CSV" }, { status: 422 });
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
            positions:         row.positions,
            team:              row.team,
            mlbLevel:          row.mlbLevel,
            active:            row.active,
            birthday:          row.birthday,
            mlbamId:           row.mlbamId,
            fangraphsId:       row.fangraphsId,
            fangraphsMinorsId: row.fangraphsMinorsId,
            cbsId:             row.cbsId,
            espnId:            row.espnId,
            yahooId:           row.yahooId,
            fantraxId:         row.fantraxId,
            retroId:           row.retroId,
            nfbcId:            row.nfbcId,
            bRefId:            row.bRefId,
          },
          update: {
            playerName:        row.playerName,
            positions:         row.positions,
            team:              row.team,
            mlbLevel:          row.mlbLevel,
            active:            row.active,
            birthday:          row.birthday,
            mlbamId:           row.mlbamId,
            fangraphsId:       row.fangraphsId,
            fangraphsMinorsId: row.fangraphsMinorsId,
            cbsId:             row.cbsId,
            espnId:            row.espnId,
            yahooId:           row.yahooId,
            fantraxId:         row.fantraxId,
            retroId:           row.retroId,
            nfbcId:            row.nfbcId,
            bRefId:            row.bRefId,
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

  const syncedAt = new Date().toISOString();
  return NextResponse.json({ total: rows.length, inserted, updated, deleted, syncedAt });
}
