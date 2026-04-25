import { describe, expect, it } from "vitest"
import { inferStatsRow } from "./infer-stats-row"

const YEAR = 2025

function makeFile(name: string) {
  return new File([], name)
}

function infer(name: string) {
  return inferStatsRow(makeFile(name), YEAR)
}

describe("inferStatsRow", () => {
  describe("id / saving / error", () => {
    it("assigns a uuid id", () => {
      const { id } = infer("batters.csv")
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      )
    })

    it("generates unique ids for each call", () => {
      const a = infer("batters.csv")
      const b = infer("batters.csv")
      expect(a.id).not.toBe(b.id)
    })

    it("starts with saving=false and error=null", () => {
      const row = infer("batters.csv")
      expect(row.saving).toBe(false)
      expect(row.error).toBeNull()
    })
  })

  describe("playerType", () => {
    it("defaults to BATTER", () => {
      expect(infer("batters.csv").playerType).toBe("BATTER")
    })

    it("detects pitcher via 'pitcher'", () => {
      expect(infer("steamer_pitcher_2025.csv").playerType).toBe("PITCHER")
    })

    it("detects pitcher via 'pitching'", () => {
      expect(infer("steamer_pitching_2025.csv").playerType).toBe("PITCHER")
    })

    it("is case-insensitive", () => {
      expect(infer("PITCHER_steamer.csv").playerType).toBe("PITCHER")
    })
  })

  describe("season", () => {
    it("extracts a 4-digit year from the filename", () => {
      expect(infer("steamer_2023_batters.csv").season).toBe(2023)
    })

    it("falls back to currentYear when no year in filename", () => {
      expect(infer("steamer_batters.csv").season).toBe(YEAR)
    })

    it("picks the first year match when multiple appear", () => {
      expect(infer("2022_steamer_2024.csv").season).toBe(2022)
    })
  })

  describe("projection", () => {
    it("defaults to None for an unrecognized name", () => {
      expect(infer("random_stats.csv").projection).toBe("None")
    })

    it("detects TheBatX before TheBat", () => {
      expect(infer("thebatx_batters.csv").projection).toBe("TheBatX")
    })

    it("detects TheBatX via bat_x pattern", () => {
      expect(infer("bat_x_pitchers.csv").projection).toBe("TheBatX")
    })

    it("detects TheBat", () => {
      expect(infer("thebat_batters.csv").projection).toBe("TheBat")
    })

    it("detects Steamer", () => {
      expect(infer("steamer_2025.csv").projection).toBe("Steamer")
    })

    it("detects ZiPSDC before ZiPS", () => {
      expect(infer("zipsdc_batters.csv").projection).toBe("ZiPSDC")
    })

    it("detects ZiPS via zips-dc", () => {
      expect(infer("zips-dc_batters.csv").projection).toBe("ZiPSDC")
    })

    it("detects ZiPS", () => {
      expect(infer("zips_batters.csv").projection).toBe("ZiPS")
    })

    it("detects DepthCharts", () => {
      expect(infer("depthcharts_batters.csv").projection).toBe("DepthCharts")
    })

    it("detects DepthCharts via depth-charts", () => {
      expect(infer("depth-charts_batters.csv").projection).toBe("DepthCharts")
    })

    it("detects ATC as whole word", () => {
      expect(infer("atc_2025_batters.csv").projection).toBe("ATC")
    })

    it("does not match ATC inside another word", () => {
      expect(infer("batch_data.csv").projection).toBe("None")
    })

    it("detects OOPSY", () => {
      expect(infer("oopsy_batters.csv").projection).toBe("OOPSY")
    })
  })

  describe("split", () => {
    it("defaults to none", () => {
      expect(infer("steamer_batters.csv").split).toBe("none")
    })

    const LEFT_CASES = [
      "vs_left", "vs left", "vsleft",
      "vs_lhb", "vs lhb", "vslhb",
      "vs_lhh", "vs lhh", "vslhh",
      "vs_lhp", "vs lhp", "vslhp",
      "vs_lh",  "vs lh",  "vslh",
      "vlhb", "vlhh", "vlhp", "vlh",
      "vl", "v_l",
      "lhp", "lhb",
    ]
    it.each(LEFT_CASES)("detects vs_left via '%s'", (pattern) => {
      expect(infer(`steamer_batters_${pattern}.csv`).split).toBe("vs_left")
    })

    const RIGHT_CASES = [
      "vs_right", "vs right", "vsright",
      "vs_rhb", "vs rhb", "vsrhb",
      "vs_rhh", "vs rhh", "vsrhh",
      "vs_rhp", "vs rhp", "vsrhp",
      "vs_rh",  "vs rh",  "vsrh",
      "vrhb", "vrhh", "vrhp", "vrh",
      "vr", "v_r",
      "rhp", "rhb",
    ]
    it.each(RIGHT_CASES)("detects vs_right via '%s'", (pattern) => {
      expect(infer(`steamer_batters_${pattern}.csv`).split).toBe("vs_right")
    })

    it("detects neutral", () => {
      expect(infer("steamer_batters_neutral.csv").split).toBe("neutral")
    })
  })

  describe("statType", () => {
    it("is actual when no projection or split", () => {
      expect(infer("actual_batters_2025.csv").statType).toBe("actual")
    })

    it("is projected when a projection is detected", () => {
      expect(infer("steamer_batters.csv").statType).toBe("projected")
    })

    it("is projected when a split is detected even without a named projection", () => {
      expect(infer("batters_vs_left.csv").statType).toBe("projected")
    })
  })

})
