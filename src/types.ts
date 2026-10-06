export const STATUSES = [
  'saved',
  'applied',
  'interviewing',
  'offer',
  'rejected',
  'withdrawn',
] as const

export type Status = (typeof STATUSES)[number]

export const STATUS_LABELS: Record<Status, string> = {
  saved: 'Saved',
  applied: 'Applied',
  interviewing: 'Interviewing',
  offer: 'Offer',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
}

/** Statuses that no longer need follow-ups. */
export const CLOSED_STATUSES: ReadonlySet<Status> = new Set(['rejected', 'withdrawn'])

export interface JobApplication {
  id: string
  company: string
  role: string
  /** ISO calendar date, YYYY-MM-DD. */
  dateApplied: string
  status: Status
  jobUrl: string
  contact: string
  /** ISO calendar date, YYYY-MM-DD, or empty string when not set. */
  followUpDate: string
  notes: string
  createdAt: string
  updatedAt: string
}

export type ApplicationDraft = Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'>

export type StatusFilter = Status | 'all'

export type SortKey = 'applied-desc' | 'applied-asc' | 'company' | 'follow-up'

export function isStatus(value: unknown): value is Status {
  return typeof value === 'string' && (STATUSES as readonly string[]).includes(value)
}
