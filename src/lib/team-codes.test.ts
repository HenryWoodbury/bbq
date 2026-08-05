import { describe, expect, it } from "vitest"
import {
  deriveLeagueFromTeam,
  deriveLevelFromFgId,
  isMiLBFangraphsId,
  normalizeTeamCode,
} from "./team-codes"

describe("isMiLBFangraphsId", () => {
  it("detects the sa prefix", () => {
    expect(isMiLBFangraphsId("sa3022054")).toBe(true)
    expect(isMiLBFangraphsId("33225")).toBe(false)
    expect(isMiLBFangraphsId(null)).toBe(false)
  })
})

describe("deriveLevelFromFgId", () => {
  it("labels sa-prefixed ids MiLB and the rest MLB", () => {
    expect(deriveLevelFromFgId("sa3022054")).toBe("MiLB")
    expect(deriveLevelFromFgId("33225")).toBe("MLB")
  })

  it("returns an empty string when there is no id", () => {
    expect(deriveLevelFromFgId(null)).toBe("")
    expect(deriveLevelFromFgId("")).toBe("")
  })
})

describe("deriveLeagueFromTeam", () => {
  it("maps teams to their league", () => {
    expect(deriveLeagueFromTeam("NYY")).toBe("AL")
    expect(deriveLeagueFromTeam("PIT")).toBe("NL")
  })

  it("returns null for free agents and unknown codes", () => {
    expect(deriveLeagueFromTeam("FA")).toBeNull()
    expect(deriveLeagueFromTeam(null)).toBeNull()
  })
})

describe("normalizeTeamCode", () => {
  it("maps foreign spellings to the canonical code", () => {
    expect(normalizeTeamCode("WSN")).toBe("WAS")
    expect(normalizeTeamCode("WSH")).toBe("WAS")
  })

  it("trims surrounding whitespace", () => {
    expect(normalizeTeamCode(" WSN ")).toBe("WAS")
    expect(normalizeTeamCode(" NYY ")).toBe("NYY")
  })

  it("passes through null and unknown codes", () => {
    expect(normalizeTeamCode(null)).toBeNull()
    expect(normalizeTeamCode("NYY")).toBe("NYY")
  })
})
