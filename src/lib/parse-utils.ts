/** Parse a string to an integer, returning null for empty strings or non-numeric input. */
export function toInt(raw: string): number | null {
  if (!raw) return null
  const n = Number.parseInt(raw, 10)
  return Number.isNaN(n) ? null : n
}
