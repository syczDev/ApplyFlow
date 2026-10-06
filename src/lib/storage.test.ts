import { describe, expect, it } from 'vitest'
import { parseApplications, sanitizeApplication } from './storage'
import { daysBetween, describeRelative, parseISODate } from './dates'

describe('parseApplications', () => {
  it('returns an empty list when nothing is stored', () => {
    expect(parseApplications(null)).toEqual({ applications: [] })
  })

  it('reports unreadable data instead of throwing', () => {
    expect(parseApplications('{not json').error).toBeDefined()
    expect(parseApplications('{"a":1}').error).toBeDefined()
  })

  it('drops invalid and duplicate records and repairs bad fields', () => {
    const result = parseApplications(
      JSON.stringify([
        { id: '1', company: 'Acme', role: 'Dev', status: 'bogus', dateApplied: 'yesterday', notes: 42 },
        { id: '1', company: 'Duplicate', role: 'Dev' },
        { id: '2', company: '', role: 'Missing company' },
        null,
        'string',
      ]),
    )
    expect(result.error).toBeUndefined()
    expect(result.applications).toHaveLength(1)
    const [app] = result.applications
    expect(app.company).toBe('Acme')
    expect(app.status).toBe('applied')
    expect(app.dateApplied).toBe('')
    expect(app.notes).toBe('')
  })

  it('round-trips a valid record unchanged', () => {
    const record = {
      id: 'x',
      company: 'Globex',
      role: 'PM',
      dateApplied: '2026-09-30',
      status: 'offer',
      jobUrl: 'https://example.com',
      contact: 'Sam',
      followUpDate: '2026-10-10',
      notes: 'Great team',
      createdAt: '2026-09-30T10:00:00.000Z',
      updatedAt: '2026-10-01T10:00:00.000Z',
    }
    expect(sanitizeApplication(record)).toEqual(record)
  })
})

describe('dates', () => {
  it('parses calendar dates in local time', () => {
    const d = parseISODate('2026-03-09')
    expect(d?.getFullYear()).toBe(2026)
    expect(d?.getMonth()).toBe(2)
    expect(d?.getDate()).toBe(9)
    expect(parseISODate('2026-13-01')).toBeNull()
  })

  it('counts calendar days across DST changes', () => {
    expect(daysBetween('2026-03-07', '2026-03-10')).toBe(3)
    expect(daysBetween('2026-11-02', '2026-10-30')).toBe(-3)
  })

  it('describes relative dates', () => {
    expect(describeRelative('2026-10-06', '2026-10-06')).toBe('today')
    expect(describeRelative('2026-10-07', '2026-10-06')).toBe('tomorrow')
    expect(describeRelative('2026-10-01', '2026-10-06')).toBe('5 days ago')
    expect(describeRelative('2026-10-16', '2026-10-06')).toBe('in 10 days')
  })
})
