import { describe, expect, it } from "vitest"
import {
  effectivePlayer,
  liveOverride,
  matchesPlayerFilters,
  type PlayerAttributeFields,
  type PlayerOverrideFields,
} from "./player-effective"

const PLAYER: PlayerAttributeFields = {
  playerName: "Jacob Gonzalez",
  fgSpecialChar: null,
  team: "PIT", // NL
  mlbLevel: "MLB",
  active: true,
  birthday: new Date("2000-03-15T00:00:00Z"),
  bats: "L",
  throws: "R",
}

const EMPTY_OVERRIDE: PlayerOverrideFields = {
  deletedAt: null,
  displayName: null,
  team: null,
  mlbLevel: null,
  league: null,
  active: null,
  birthday: null,
  bats: null,
  throws: null,
}

describe("liveOverride", () => {
  it("returns the override when live", () => {
    expect(liveOverride(EMPTY_OVERRIDE)).toBe(EMPTY_OVERRIDE)
  })

  it("returns null when soft-deleted", () => {
    expect(liveOverride({ ...EMPTY_OVERRIDE, deletedAt: new Date() })).toBeNull()
  })

  it("returns null for absent overrides", () => {
    expect(liveOverride(null)).toBeNull()
    expect(liveOverride(undefined)).toBeNull()
  })
})

describe("effectivePlayer — display name precedence", () => {
  it("prefers the override display name", () => {
    const e = effectivePlayer(PLAYER, {
      ...EMPTY_OVERRIDE,
      displayName: "Jake Gonzalez",
    })
    expect(e.displayName).toBe("Jake Gonzalez")
  })

  it("falls back to fgSpecialChar, then playerName", () => {
    expect(
      effectivePlayer({ ...PLAYER, fgSpecialChar: "Jacob Gonzálved" }, null)
        .displayName,
    ).toBe("Jacob Gonzálved")
    expect(effectivePlayer(PLAYER, null).displayName).toBe("Jacob Gonzalez")
  })
})

describe("effectivePlayer — attributes", () => {
  it("takes override values when set", () => {
    const e = effectivePlayer(PLAYER, {
      ...EMPTY_OVERRIDE,
      team: "NYY",
      mlbLevel: "AAA",
      active: false,
      bats: "R",
      throws: "L",
      birthday: new Date("1999-01-01T00:00:00Z"),
    })
    expect(e.team).toBe("NYY")
    expect(e.mlbLevel).toBe("AAA")
    expect(e.active).toBe(false)
    expect(e.bats).toBe("R")
    expect(e.throws).toBe("L")
    expect(e.birthday?.getUTCFullYear()).toBe(1999)
  })

  it("keeps canonical values when the override leaves fields null", () => {
    const e = effectivePlayer(PLAYER, EMPTY_OVERRIDE)
    expect(e.team).toBe("PIT")
    expect(e.active).toBe(true)
    expect(e.bats).toBe("L")
  })

  it("ignores a soft-deleted override entirely", () => {
    const e = effectivePlayer(PLAYER, {
      ...EMPTY_OVERRIDE,
      deletedAt: new Date(),
      team: "NYY",
      active: false,
      displayName: "Should Not Win",
    })
    expect(e.team).toBe("PIT")
    expect(e.active).toBe(true)
    expect(e.displayName).toBe("Jacob Gonzalez")
  })

  it("distinguishes active: false from active: null", () => {
    // false is a real override; null means "no opinion, use the base value"
    expect(
      effectivePlayer({ ...PLAYER, active: true }, {
        ...EMPTY_OVERRIDE,
        active: false,
      }).active,
    ).toBe(false)
    expect(
      effectivePlayer({ ...PLAYER, active: true }, {
        ...EMPTY_OVERRIDE,
        active: null,
      }).active,
    ).toBe(true)
  })
})

describe("effectivePlayer — league", () => {
  it("derives the league from the canonical team", () => {
    expect(effectivePlayer(PLAYER, null).league).toBe("NL")
  })

  it("derives from the overridden team, not the canonical one", () => {
    // PIT is NL; NYY is AL
    expect(
      effectivePlayer(PLAYER, { ...EMPTY_OVERRIDE, team: "NYY" }).league,
    ).toBe("AL")
  })

  it("prefers an explicit league override over the team", () => {
    expect(
      effectivePlayer(PLAYER, { ...EMPTY_OVERRIDE, league: "AL" }).league,
    ).toBe("AL")
  })

  it("is null for an unrecognized team", () => {
    expect(effectivePlayer({ ...PLAYER, team: "FA" }, null).league).toBeNull()
  })
})

describe("matchesPlayerFilters", () => {
  const eff = (active: boolean, league: string | null) => ({ active, league })

  it("passes everything when both filters are all", () => {
    expect(
      matchesPlayerFilters(eff(false, null), null, {
        active: "all",
        league: "all",
      }),
    ).toBe(true)
  })

  it("filters on effective active", () => {
    const f = { active: "yes", league: "all" } as const
    expect(matchesPlayerFilters(eff(true, "NL"), "33225", f)).toBe(true)
    expect(matchesPlayerFilters(eff(false, "NL"), "33225", f)).toBe(false)
  })

  it("filters on inactive", () => {
    const f = { active: "no", league: "all" } as const
    expect(matchesPlayerFilters(eff(false, "NL"), "33225", f)).toBe(true)
    expect(matchesPlayerFilters(eff(true, "NL"), "33225", f)).toBe(false)
  })

  it("splits MLB and MiLB on the Fangraphs id", () => {
    const mlb = { active: "all", league: "mlb" } as const
    const milb = { active: "all", league: "milb" } as const
    expect(matchesPlayerFilters(eff(true, "NL"), "33225", mlb)).toBe(true)
    expect(matchesPlayerFilters(eff(true, "NL"), "sa3022054", mlb)).toBe(false)
    expect(matchesPlayerFilters(eff(true, "NL"), "sa3022054", milb)).toBe(true)
    expect(matchesPlayerFilters(eff(true, "NL"), "33225", milb)).toBe(false)
  })

  it("excludes a player with no Fangraphs id from the MLB filter", () => {
    expect(
      matchesPlayerFilters(eff(true, "NL"), null, {
        active: "all",
        league: "mlb",
      }),
    ).toBe(false)
  })

  it("filters on effective league", () => {
    expect(
      matchesPlayerFilters(eff(true, "AL"), "33225", {
        active: "all",
        league: "al",
      }),
    ).toBe(true)
    expect(
      matchesPlayerFilters(eff(true, "NL"), "33225", {
        active: "all",
        league: "al",
      }),
    ).toBe(false)
  })

  it("applies active and league together", () => {
    const f = { active: "yes", league: "nl" } as const
    expect(matchesPlayerFilters(eff(true, "NL"), "33225", f)).toBe(true)
    expect(matchesPlayerFilters(eff(false, "NL"), "33225", f)).toBe(false)
    expect(matchesPlayerFilters(eff(true, "AL"), "33225", f)).toBe(false)
  })
})
