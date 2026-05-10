import { describe, expect, it, vi } from "vitest"
import { csvEscape, triggerCsvDownload } from "./csv"

describe("csvEscape", () => {
  it("returns empty string for null", () => {
    expect(csvEscape(null)).toBe("")
  })

  it("returns empty string for undefined", () => {
    expect(csvEscape(undefined)).toBe("")
  })

  it("passes through plain strings unchanged", () => {
    expect(csvEscape("hello")).toBe("hello")
    expect(csvEscape("Los Angeles Dodgers")).toBe("Los Angeles Dodgers")
  })

  it("stringifies numbers without quoting", () => {
    expect(csvEscape(42)).toBe("42")
    expect(csvEscape(100)).toBe("100")
  })

  it("quotes strings that contain a comma", () => {
    expect(csvEscape("Smith, Jr.")).toBe('"Smith, Jr."')
  })

  it("escapes internal double quotes and wraps in quotes", () => {
    expect(csvEscape('say "hello"')).toBe('"say ""hello"""')
  })

  it("quotes strings that contain a newline", () => {
    expect(csvEscape("line1\nline2")).toBe('"line1\nline2"')
  })
})

describe("triggerCsvDownload", () => {
  it("creates an anchor with the correct filename and triggers a click", () => {
    const objectUrl = "blob:mock-url"
    const createObjectURL = vi.fn(() => objectUrl)
    const revokeObjectURL = vi.fn()
    const clickSpy = vi.fn()
    const anchor = { href: "", download: "", click: clickSpy }

    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL })
    vi.stubGlobal("Blob", class MockBlob {
      content: string[]
      options: unknown
      constructor(content: string[], options: unknown) {
        this.content = content
        this.options = options
      }
    })
    vi.stubGlobal("document", {
      createElement: vi.fn(() => anchor),
    })

    triggerCsvDownload("a,b\n1,2", "report.csv")

    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(anchor.href).toBe(objectUrl)
    expect(anchor.download).toBe("report.csv")
    expect(clickSpy).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith(objectUrl)

    vi.unstubAllGlobals()
  })
})
