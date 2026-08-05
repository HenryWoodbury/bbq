import { describe, expect, it } from "vitest"
import {
  isManualSfbbId,
  MANUAL_SFBB_PREFIX,
  manualPlayerName,
  newManualSfbbId,
} from "./manual-players"

describe("newManualSfbbId", () => {
  it("namespaces the id with the manual prefix", () => {
    expect(newManualSfbbId().startsWith(MANUAL_SFBB_PREFIX)).toBe(true)
  })

  it("returns a distinct id on every call", () => {
    const ids = new Set(Array.from({ length: 50 }, () => newManualSfbbId()))
    expect(ids.size).toBe(50)
  })
})

describe("isManualSfbbId", () => {
  it("recognizes synthetic ids", () => {
    expect(isManualSfbbId(newManualSfbbId())).toBe(true)
  })

  it("rejects real SFBB ids", () => {
    // Real Player ID Map ids are bare numeric strings
    expect(isManualSfbbId("15640")).toBe(false)
    expect(isManualSfbbId("sa3022054")).toBe(false)
  })

  it("does not match the prefix mid-string", () => {
    expect(isManualSfbbId("15640manual:")).toBe(false)
  })
})

describe("manualPlayerName", () => {
  it("prefers displayName", () => {
    expect(
      manualPlayerName({
        displayName: "Jacob Gonzalez",
        firstName: "Jake",
        lastName: "Gonzo",
      }),
    ).toBe("Jacob Gonzalez")
  })

  it("falls back to first + last", () => {
    expect(
      manualPlayerName({
        displayName: null,
        firstName: "Jacob",
        lastName: "Gonzalez",
      }),
    ).toBe("Jacob Gonzalez")
  })

  it("handles a lone first or last name", () => {
    expect(manualPlayerName({ firstName: "Ichiro" })).toBe("Ichiro")
    expect(manualPlayerName({ lastName: "Gonzalez" })).toBe("Gonzalez")
  })

  it("treats whitespace-only values as absent", () => {
    expect(
      manualPlayerName({ displayName: "   ", firstName: "Jacob" }),
    ).toBe("Jacob")
  })

  it("never returns an empty string — Player.playerName is non-null", () => {
    expect(manualPlayerName({})).toBe("Unnamed Player")
    expect(manualPlayerName({ displayName: null, lastName: null })).toBe(
      "Unnamed Player",
    )
  })
})
