import { describe, expect, it } from "vitest"
import {
  excludeManualPlayers,
  isManualSfbbId,
  MANUAL_SFBB_PREFIX,
  manualPlayerName,
  newManualSfbbId,
  onlyManualPlayers,
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

describe("excludeManualPlayers / onlyManualPlayers", () => {
  const PREFIX_TEST = { sfbbId: { startsWith: MANUAL_SFBB_PREFIX } }

  it("ANDs the prefix test onto the caller's clause", () => {
    expect(excludeManualPlayers({ deletedAt: null })).toEqual({
      AND: [{ deletedAt: null }, { NOT: PREFIX_TEST }],
    })
    expect(onlyManualPlayers({ deletedAt: null })).toEqual({
      AND: [{ deletedAt: null }, PREFIX_TEST],
    })
  })

  it("preserves a caller clause that uses the same keys", () => {
    // The replace-mode sweep's own clause is `sfbbId: { notIn }`, and a caller
    // may already have a `NOT`. Merging the fragment in would silently drop one
    // side with no type error — hence the AND.
    const sweep = {
      sfbbId: { notIn: ["15640"] },
      NOT: { team: "FA" },
      deletedAt: null,
    }

    expect(excludeManualPlayers(sweep)).toEqual({
      AND: [sweep, { NOT: PREFIX_TEST }],
    })
  })

  it("does not mutate the clause it is given", () => {
    const where = { deletedAt: null }
    excludeManualPlayers(where)
    onlyManualPlayers(where)
    expect(where).toEqual({ deletedAt: null })
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
