/**
 * Format a Date or ISO string for display: "19-Apr-26 02:30:45 pm"
 * Returns "" for null/undefined inputs.
 *
 * Temporal migration: replace body with Temporal.ZonedDateTime.from(input)
 * and format via toLocaleDateString / toLocaleTimeString equivalents.
 */
export function formatDateTime(
  input: Date | string | null | undefined,
): string {
  if (input == null) return ""
  const d = input instanceof Date ? input : new Date(input)
  const datePart = d
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    })
    .replace(/ /g, "-")
  const timePart = d
    .toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
    .toLowerCase()
  return `${datePart} ${timePart}`
}

/**
 * Split a formatted datetime string into date and time parts.
 * Returns { date, time } where time is the portion after the first space.
 */
export function splitDateTime(input: Date | string | null | undefined): {
  date: string
  time: string
} {
  const formatted = formatDateTime(input)
  const idx = formatted.indexOf(" ")
  if (idx < 0) return { date: formatted, time: "" }
  return { date: formatted.slice(0, idx), time: formatted.slice(idx + 1) }
}

/**
 * Serialize a Date to YYYY-MM-DD for storage/form values.
 * Returns null for null/undefined inputs.
 *
 * Temporal migration: replace with Temporal.PlainDate.from(zonedDateTime).toString()
 */
export function toISODate(input: Date | null | undefined): string | null {
  if (input == null) return null
  return input.toISOString().slice(0, 10)
}

/**
 * Today's date in the local timezone as YYYY-MM-DD.
 *
 * Unlike toISODate above, which is UTC: an evening call here still returns
 * today's local date rather than rolling over to tomorrow. Used for stamping
 * generated export filenames.
 *
 * Temporal migration: replace with Temporal.Now.plainDateISO().toString()
 */
export function todayStamp(): string {
  const [month, day, year] = new Date()
    .toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .split("/")
  return `${year}-${month}-${day}`
}
