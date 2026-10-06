import {
  CLOSED_STATUSES,
  STATUSES,
  type ApplicationDraft,
  type JobApplication,
  type SortKey,
  type Status,
  type StatusFilter,
} from '../types'
import { daysBetween, isValidISODate } from './dates'

export function matchesQuery(app: JobApplication, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [app.company, app.role, app.contact, app.notes].some((field) =>
    field.toLowerCase().includes(q),
  )
}

export function filterApplications(
  apps: JobApplication[],
  query: string,
  status: StatusFilter,
): JobApplication[] {
  return apps.filter(
    (app) => (status === 'all' || app.status === status) && matchesQuery(app, query),
  )
}

export function sortApplications(apps: JobApplication[], sort: SortKey): JobApplication[] {
  const sorted = [...apps]
  const byCompany = (a: JobApplication, b: JobApplication) =>
    a.company.localeCompare(b.company, undefined, { sensitivity: 'base' }) ||
    a.role.localeCompare(b.role, undefined, { sensitivity: 'base' })
  // Missing dates sort last regardless of direction.
  const byDate = (a: string, b: string, dir: 1 | -1) => {
    if (!a && !b) return 0
    if (!a) return 1
    if (!b) return -1
    return a < b ? -dir : a > b ? dir : 0
  }

  switch (sort) {
    case 'applied-desc':
      return sorted.sort((a, b) => byDate(a.dateApplied, b.dateApplied, -1) || byCompany(a, b))
    case 'applied-asc':
      return sorted.sort((a, b) => byDate(a.dateApplied, b.dateApplied, 1) || byCompany(a, b))
    case 'company':
      return sorted.sort(byCompany)
    case 'follow-up':
      return sorted.sort((a, b) => byDate(a.followUpDate, b.followUpDate, 1) || byCompany(a, b))
  }
}

export type FollowUpState = 'overdue' | 'today' | 'upcoming'

/** Follow-up urgency, or null when there is nothing to follow up on. */
export function followUpState(app: JobApplication, today: string): FollowUpState | null {
  if (!app.followUpDate || CLOSED_STATUSES.has(app.status)) return null
  const diff = daysBetween(today, app.followUpDate)
  if (diff < 0) return 'overdue'
  if (diff === 0) return 'today'
  return 'upcoming'
}

export interface DashboardStats {
  total: number
  active: number
  interviewing: number
  offers: number
  /** Share of submitted applications that reached interview or offer, 0–100. */
  interviewRate: number | null
  followUpsDue: number
  byStatus: Record<Status, number>
}

export function computeStats(apps: JobApplication[], today: string): DashboardStats {
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<Status, number>
  let followUpsDue = 0
  for (const app of apps) {
    byStatus[app.status] += 1
    const state = followUpState(app, today)
    if (state === 'overdue' || state === 'today') followUpsDue += 1
  }
  const submitted = apps.length - byStatus.saved
  const progressed = byStatus.interviewing + byStatus.offer
  return {
    total: apps.length,
    active: byStatus.saved + byStatus.applied + byStatus.interviewing,
    interviewing: byStatus.interviewing,
    offers: byStatus.offer,
    interviewRate: submitted > 0 ? Math.round((progressed / submitted) * 100) : null,
    followUpsDue,
    byStatus,
  }
}

/** Open follow-ups, most urgent first. */
export function upcomingFollowUps(
  apps: JobApplication[],
  today: string,
  limit = 5,
): JobApplication[] {
  return apps
    .filter((app) => followUpState(app, today) !== null)
    .sort((a, b) => (a.followUpDate < b.followUpDate ? -1 : a.followUpDate > b.followUpDate ? 1 : 0))
    .slice(0, limit)
}

export type DraftErrors = Partial<Record<keyof ApplicationDraft, string>>

/** Adds https:// to bare domains like "jobs.example.com/123". */
export function normalizeUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return /^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.includes('.')
  } catch {
    return false
  }
}

export function normalizeDraft(draft: ApplicationDraft): ApplicationDraft {
  return {
    ...draft,
    company: draft.company.trim(),
    role: draft.role.trim(),
    contact: draft.contact.trim(),
    notes: draft.notes.trim(),
    jobUrl: normalizeUrl(draft.jobUrl),
  }
}

/** Validates a normalized draft. Returns an empty object when valid. */
export function validateDraft(draft: ApplicationDraft): DraftErrors {
  const errors: DraftErrors = {}
  if (!draft.company) errors.company = 'Enter the company name.'
  if (!draft.role) errors.role = 'Enter the role or job title.'
  if (!draft.dateApplied) errors.dateApplied = 'Enter the date you applied.'
  else if (!isValidISODate(draft.dateApplied)) errors.dateApplied = 'Enter a valid date.'
  if (draft.followUpDate && !isValidISODate(draft.followUpDate)) {
    errors.followUpDate = 'Enter a valid date, or leave it empty.'
  }
  if (draft.jobUrl && !isValidHttpUrl(draft.jobUrl)) {
    errors.jobUrl = 'Enter a full web address, like https://example.com/jobs/123.'
  }
  return errors
}
