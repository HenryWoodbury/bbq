import { describe, expect, it } from "vitest"
import { addRanks, applyFallback, csvYearDisplay, toCsv } from "./park-factors"
import type { DisplayRow, ParkFactorRow } from "./park-factors"

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeRow(overrides: Partial<ParkFactorRow> = {}): ParkFactorRow {
  return {
    venueName: "Test Stadium",
    teamName: "Test Team",
    season: 2026,
    batSide: "R",
    rolling: 3,
    factors: { index_woba: 100 },
    ...overrides,
  }
}

const COORS = makeRow({
  venueName: "Coors Field",
  teamName: "Colorado Rockies",
  factors: { index_woba: 130 },
})

const DODGERS = makeRow({
  venueName: "Dodger Stadium",
  teamName: "Los Angeles Dodgers",
  factors: { index_woba: 95 },
})

const ATHLETICS_2YR = makeRow({
  venueName: "Sutter Health Park",
  teamName: "Athletics",
  rolling: 2,
  factors: { index_woba: 98 },
})

const ATHLETICS_1YR = makeRow({
  venueName: "Sutter Health Park",
  teamName: "Athletics",
  rolling: 1,
  factors: { index_woba: 96 },
})

// ── addRanks ──────────────────────────────────────────────────────────────────

describe("addRanks", () => {
  it("assigns rank 1 to the highest index_woba", () => {
    const rows = addRanks([DODGERS, COORS])
    const coors = rows.find((r) => r.venueName === "Coors Field")
    expect(coors?.rank).toBe(1)
  })

  it("assigns rank 2 to the lower index_woba", () => {
    const rows = addRanks([COORS, DODGERS])
    const dodgers = rows.find((r) => r.venueName === "Dodger Stadium")
    expect(dodgers?.rank).toBe(2)
  })

  it("preserves original array order", () => {
    const rows = addRanks([DODGERS, COORS])
    expect(rows[0].venueName).toBe("Dodger Stadium")
    expect(rows[1].venueName).toBe("Coors Field")
  })

  it("handles a single row with rank 1", () => {
    const [row] = addRanks([COORS])
    expect(row.rank).toBe(1)
  })

  it("returns an empty array for empty input", () => {
    expect(addRanks([])).toEqual([])
  })
})

// ── csvYearDisplay ────────────────────────────────────────────────────────────

describe("csvYearDisplay", () => {
  it("returns just the season for 1-year rolling", () => {
    expect(csvYearDisplay(2026, 1)).toBe("2026")
  })

  it("shows a spread for 3-year rolling", () => {
    expect(csvYearDisplay(2026, 3)).toBe("2024-26")
  })

  it("shows a spread for 2-year rolling", () => {
    expect(csvYearDisplay(2026, 2)).toBe("2025-26")
  })

  it("handles decade boundaries", () => {
    expect(csvYearDisplay(2030, 3)).toBe("2028-30")
  })
})

// ── applyFallback ─────────────────────────────────────────────────────────────

describe("applyFallback", () => {
  it("returns only target-rolling rows when all venues are covered", () => {
    const rows = [COORS, DODGERS]
    const result = applyFallback(rows, 3)
    expect(result).toHaveLength(2)
    expect(result.every((r) => r.rolling === 3)).toBe(true)
  })

  it("fills a missing venue from the next shorter window (2yr)", () => {
    const rows = [COORS, DODGERS, ATHLETICS_2YR]
    const result = applyFallback(rows, 3)
    expect(result).toHaveLength(3)
    const athletics = result.find((r) => r.venueName === "Sutter Health Park")
    expect(athletics?.rolling).toBe(2)
  })

  it("fills a missing venue from 1yr when 2yr is also absent", () => {
    const rows = [COORS, DODGERS, ATHLETICS_1YR]
    const result = applyFallback(rows, 3)
    const athletics = result.find((r) => r.venueName === "Sutter Health Park")
    expect(athletics?.rolling).toBe(1)
  })

  it("prefers the longer fallback window (2yr over 1yr)", () => {
    const rows = [COORS, DODGERS, ATHLETICS_2YR, ATHLETICS_1YR]
    const result = applyFallback(rows, 3)
    const athletics = result.filter((r) => r.venueName === "Sutter Health Park")
    expect(athletics).toHaveLength(1)
    expect(athletics[0].rolling).toBe(2)
  })

  it("does not duplicate a venue already covered by target rolling", () => {
    const dodgers2yr = makeRow({
      venueName: "Dodger Stadium",
      rolling: 2,
      factors: { index_woba: 94 },
    })
    const rows = [COORS, DODGERS, dodgers2yr]
    const result = applyFallback(rows, 3)
    const dodgersRows = result.filter((r) => r.venueName === "Dodger Stadium")
    expect(dodgersRows).toHaveLength(1)
    expect(dodgersRows[0].rolling).toBe(3)
  })

  it("returns empty for empty input", () => {
    expect(applyFallback([], 3)).toEqual([])
  })
})

// ── toCsv ─────────────────────────────────────────────────────────────────────

describe("toCsv", () => {
  it("returns empty string for empty input", () => {
    expect(toCsv([])).toBe("")
  })

  it("produces a header row with correct column names", () => {
    const [header] = toCsv([{ ...COORS, rank: 1 }]).split("\n")
    expect(header).toMatch(/^Abbr,Team,Venue,Year,Park Factor,/)
    expect(header).toContain("wOBAcon")
    expect(header).toContain("PA")
  })

  it("resolves the team abbreviation from the full name", () => {
    const rows: DisplayRow[] = [{ ...COORS, rank: 1 }]
    const lines = toCsv(rows).split("\n")
    expect(lines[1]).toMatch(/^COL,/)
  })

  it("outputs empty abbr for unknown team names", () => {
    const rows: DisplayRow[] = [
      { ...makeRow({ teamName: "Unknown Nine" }), rank: 1 },
    ]
    const lines = toCsv(rows).split("\n")
    expect(lines[1]).toMatch(/^,/)
  })

  it("outputs empty abbr when teamName is null", () => {
    const rows: DisplayRow[] = [
      { ...makeRow({ teamName: null }), rank: 1 },
    ]
    const lines = toCsv(rows).split("\n")
    expect(lines[1]).toMatch(/^,/)
  })

  it("quotes team and venue names that contain commas", () => {
    const rows: DisplayRow[] = [
      {
        ...makeRow({
          teamName: "Smith, Jones & Co",
          venueName: "Park, The",
        }),
        rank: 1,
      },
    ]
    const lines = toCsv(rows).split("\n")
    expect(lines[1]).toContain('"Smith, Jones & Co"')
    expect(lines[1]).toContain('"Park, The"')
  })

  it("uses 'Park Factor' as the header for index_woba (not PF)", () => {
    const [header] = toCsv([{ ...COORS, rank: 1 }]).split("\n")
    expect(header).toContain("Park Factor")
    expect(header).not.toContain(",PF,")
  })

  it("shows year spread for 3-year rolling", () => {
    const rows: DisplayRow[] = [{ ...COORS, season: 2026, rolling: 3, rank: 1 }]
    const lines = toCsv(rows).split("\n")
    expect(lines[1]).toContain("2024-26")
  })

  it("shows single year for 1-year rolling", () => {
    const rows: DisplayRow[] = [{ ...COORS, season: 2026, rolling: 1, rank: 1 }]
    const lines = toCsv(rows).split("\n")
    expect(lines[1]).toContain("2026")
    expect(lines[1]).not.toContain("-26")
  })

  it("includes the correct number of columns per row", () => {
    const rows: DisplayRow[] = [{ ...COORS, rank: 1 }]
    const lines = toCsv(rows).split("\n")
    const headerCols = lines[0].split(",").length
    // Split on commas outside quotes is naive but sufficient for simple data
    expect(lines[1].split(",")).toHaveLength(headerCols)
  })
})
