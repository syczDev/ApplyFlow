const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

/** Parses YYYY-MM-DD as a local calendar date (avoids UTC off-by-one shifts). */
export function parseISODate(value: string): Date | null {
  const match = ISO_DATE.exec(value)
  if (!match) return null
  const y = Number(match[1])
  const m = Number(match[2])
  const d = Number(match[3])
  const date = new Date(y, m - 1, d)
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null
  return date
}

export function isValidISODate(value: string): boolean {
  return parseISODate(value) !== null
}

export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayISO(): string {
  return toISODate(new Date())
}

export function addDays(iso: string, days: number): string {
  const date = parseISODate(iso)
  if (!date) return iso
  date.setDate(date.getDate() + days)
  return toISODate(date)
}

/** Whole calendar days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: string, to: string): number {
  const a = parseISODate(from)
  const b = parseISODate(to)
  if (!a || !b) return 0
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((utcB - utcA) / 86_400_000)
}

const formatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

export function formatDate(iso: string): string {
  const date = parseISODate(iso)
  return date ? formatter.format(date) : ''
}

/** Human phrasing for a date relative to today. */
export function describeRelative(iso: string, today: string): string {
  const diff = daysBetween(today, iso)
  if (diff === 0) return 'today'
  if (diff === 1) return 'tomorrow'
  if (diff === -1) return 'yesterday'
  if (diff > 0) return `in ${diff} days`
  return `${-diff} days ago`
}
