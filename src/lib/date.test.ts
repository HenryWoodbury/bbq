import { afterEach, describe, expect, it, vi } from "vitest"
import { todayStamp, toISODate } from "./date"

const ORIGINAL_TZ = process.env.TZ

// The suite pins TZ per test rather than relying on the runner's timezone,
// so the local-vs-UTC assertions mean the same thing on every machine and in
// CI. Node re-resolves the zone on assignment, including for Intl.
function at(tz: string, instant: string) {
  process.env.TZ = tz
  vi.useFakeTimers()
  vi.setSystemTime(new Date(instant))
}

describe("todayStamp", () => {
  afterEach(() => {
    vi.useRealTimers()
    process.env.TZ = ORIGINAL_TZ
  })

  it("formats the current local date as YYYY-MM-DD", () => {
    at("America/New_York", "2026-08-06T16:30:00Z")
    expect(todayStamp()).toBe("2026-08-06")
  })

  it("stays on the local date when UTC has already rolled over", () => {
    // 23:30 EDT on Aug 6 — the same instant is Aug 7 in UTC.
    at("America/New_York", "2026-08-07T03:30:00Z")
    expect(todayStamp()).toBe("2026-08-06")
    expect(toISODate(new Date())).toBe("2026-08-07")
  })

  it("stays on the local date when UTC has not yet rolled over", () => {
    // 07:00 JST on Aug 7 — the same instant is still Aug 6 in UTC.
    at("Asia/Tokyo", "2026-08-06T22:00:00Z")
    expect(todayStamp()).toBe("2026-08-07")
    expect(toISODate(new Date())).toBe("2026-08-06")
  })

  it("zero-pads single-digit months and days", () => {
    at("UTC", "2026-01-09T12:00:00Z")
    expect(todayStamp()).toBe("2026-01-09")
  })
})
