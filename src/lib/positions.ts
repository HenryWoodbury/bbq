export function parsePositions(raw: string): string[] {
  return raw
    .split(/[\s/,\t]+/)
    .map((p) => p.trim())
    .filter(Boolean);
}
