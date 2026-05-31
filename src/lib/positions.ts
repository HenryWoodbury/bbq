export function parsePositions(raw: string): string[] {
  return raw
    .split(/[\s/,\t]+/)
    .map((p) => p.trim())
    .filter(Boolean)
}

/** Normalizes a stored positions array so every element is an individual token.
 *  Guards against legacy data stored as ["SP/RP"] instead of ["SP","RP"]. */
export function flatPositions(positions: string[]): string[] {
  return [...new Set(positions.flatMap(parsePositions))]
}
