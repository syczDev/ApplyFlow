import { isStatus, type JobApplication } from '../types'
import { isValidISODate } from './dates'

export const STORAGE_KEY = 'applyflow:applications:v1'

export interface LoadResult {
  applications: JobApplication[]
  /** Set when stored data existed but could not be read. */
  error?: string
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

/**
 * Turns one untrusted stored record into a valid application, or null if it is
 * missing the fields the app cannot work without.
 */
export function sanitizeApplication(raw: unknown): JobApplication | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  const id = asString(r.id)
  const company = asString(r.company).trim()
  const role = asString(r.role).trim()
  if (!id || !company || !role) return null

  const now = new Date().toISOString()
  const dateApplied = asString(r.dateApplied)
  const followUpDate = asString(r.followUpDate)
  return {
    id,
    company,
    role,
    dateApplied: isValidISODate(dateApplied) ? dateApplied : '',
    status: isStatus(r.status) ? r.status : 'applied',
    jobUrl: asString(r.jobUrl),
    contact: asString(r.contact),
    followUpDate: isValidISODate(followUpDate) ? followUpDate : '',
    notes: asString(r.notes),
    createdAt: asString(r.createdAt) || now,
    updatedAt: asString(r.updatedAt) || now,
  }
}

export function parseApplications(json: string | null): LoadResult {
  if (json === null) return { applications: [] }
  try {
    const data: unknown = JSON.parse(json)
    if (!Array.isArray(data)) {
      return { applications: [], error: 'Saved data was not in the expected format.' }
    }
    const seen = new Set<string>()
    const applications: JobApplication[] = []
    for (const item of data) {
      const app = sanitizeApplication(item)
      if (app && !seen.has(app.id)) {
        seen.add(app.id)
        applications.push(app)
      }
    }
    return { applications }
  } catch {
    return { applications: [], error: 'Saved data could not be read.' }
  }
}

function getStorage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function loadApplications(): LoadResult {
  const storage = getStorage()
  if (!storage) {
    return { applications: [], error: 'Browser storage is unavailable, so changes will not be saved.' }
  }
  try {
    return parseApplications(storage.getItem(STORAGE_KEY))
  } catch {
    return { applications: [], error: 'Browser storage is unavailable, so changes will not be saved.' }
  }
}

/** Returns false when the write fails (quota exceeded, private mode, blocked storage). */
export function saveApplications(applications: JobApplication[]): boolean {
  const storage = getStorage()
  if (!storage) return false
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(applications))
    return true
  } catch {
    return false
  }
}

export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
