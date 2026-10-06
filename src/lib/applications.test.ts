import { describe, expect, it } from 'vitest'
import type { JobApplication } from '../types'
import {
  computeStats,
  filterApplications,
  followUpState,
  normalizeDraft,
  normalizeUrl,
  sortApplications,
  upcomingFollowUps,
  validateDraft,
} from './applications'

const TODAY = '2026-10-06'

function make(overrides: Partial<JobApplication>): JobApplication {
  return {
    id: overrides.id ?? Math.random().toString(36),
    company: 'Acme',
    role: 'Engineer',
    dateApplied: '2026-10-01',
    status: 'applied',
    jobUrl: '',
    contact: '',
    followUpDate: '',
    notes: '',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('filterApplications', () => {
  const apps = [
    make({ id: '1', company: 'Northwind', role: 'Frontend', status: 'interviewing' }),
    make({ id: '2', company: 'Globex', role: 'Designer', notes: 'Met at a React meetup' }),
    make({ id: '3', company: 'Initech', contact: 'Priya Shah', status: 'rejected' }),
  ]

  it('matches company, role, contact and notes case-insensitively', () => {
    expect(filterApplications(apps, 'north', 'all').map((a) => a.id)).toEqual(['1'])
    expect(filterApplications(apps, 'DESIGN', 'all').map((a) => a.id)).toEqual(['2'])
    expect(filterApplications(apps, 'priya', 'all').map((a) => a.id)).toEqual(['3'])
    expect(filterApplications(apps, 'react', 'all').map((a) => a.id)).toEqual(['2'])
  })

  it('combines search with status filter', () => {
    expect(filterApplications(apps, '', 'rejected').map((a) => a.id)).toEqual(['3'])
    expect(filterApplications(apps, 'globex', 'rejected')).toEqual([])
    expect(filterApplications(apps, '   ', 'all')).toHaveLength(3)
  })
})

describe('sortApplications', () => {
  const apps = [
    make({ id: 'a', company: 'beta', dateApplied: '2026-09-01', followUpDate: '' }),
    make({ id: 'b', company: 'Alpha', dateApplied: '2026-10-01', followUpDate: '2026-10-10' }),
    make({ id: 'c', company: 'Gamma', dateApplied: '', followUpDate: '2026-10-07' }),
  ]

  it('sorts by applied date with missing dates last', () => {
    expect(sortApplications(apps, 'applied-desc').map((a) => a.id)).toEqual(['b', 'a', 'c'])
    expect(sortApplications(apps, 'applied-asc').map((a) => a.id)).toEqual(['a', 'b', 'c'])
  })

  it('sorts by company ignoring case', () => {
    expect(sortApplications(apps, 'company').map((a) => a.id)).toEqual(['b', 'a', 'c'])
  })

  it('sorts by soonest follow-up', () => {
    expect(sortApplications(apps, 'follow-up').map((a) => a.id)).toEqual(['c', 'b', 'a'])
  })

  it('does not mutate the input', () => {
    const copy = [...apps]
    sortApplications(apps, 'company')
    expect(apps).toEqual(copy)
  })
})

describe('follow-ups and stats', () => {
  it('classifies follow-up urgency and ignores closed applications', () => {
    expect(followUpState(make({ followUpDate: '2026-10-05' }), TODAY)).toBe('overdue')
    expect(followUpState(make({ followUpDate: TODAY }), TODAY)).toBe('today')
    expect(followUpState(make({ followUpDate: '2026-10-09' }), TODAY)).toBe('upcoming')
    expect(followUpState(make({ followUpDate: '' }), TODAY)).toBeNull()
    expect(followUpState(make({ followUpDate: '2026-10-05', status: 'rejected' }), TODAY)).toBeNull()
  })

  it('computes dashboard stats', () => {
    const stats = computeStats(
      [
        make({ status: 'saved' }),
        make({ status: 'applied', followUpDate: '2026-10-01' }),
        make({ status: 'interviewing', followUpDate: TODAY }),
        make({ status: 'offer' }),
        make({ status: 'rejected', followUpDate: '2026-10-01' }),
      ],
      TODAY,
    )
    expect(stats.total).toBe(5)
    expect(stats.active).toBe(3)
    expect(stats.offers).toBe(1)
    expect(stats.followUpsDue).toBe(2)
    // 4 submitted (excludes saved), 2 reached interview/offer.
    expect(stats.interviewRate).toBe(50)
    expect(stats.byStatus.rejected).toBe(1)
  })

  it('has no interview rate before anything is submitted', () => {
    expect(computeStats([make({ status: 'saved' })], TODAY).interviewRate).toBeNull()
    expect(computeStats([], TODAY).interviewRate).toBeNull()
  })

  it('lists open follow-ups soonest first', () => {
    const list = upcomingFollowUps(
      [
        make({ id: 'later', followUpDate: '2026-10-20' }),
        make({ id: 'none' }),
        make({ id: 'overdue', followUpDate: '2026-10-02' }),
        make({ id: 'closed', followUpDate: '2026-10-03', status: 'withdrawn' }),
      ],
      TODAY,
    )
    expect(list.map((a) => a.id)).toEqual(['overdue', 'later'])
  })
})

describe('validation', () => {
  const valid = {
    company: 'Acme',
    role: 'Engineer',
    dateApplied: TODAY,
    status: 'applied' as const,
    jobUrl: '',
    contact: '',
    followUpDate: '',
    notes: '',
  }

  it('accepts a minimal valid draft', () => {
    expect(validateDraft(valid)).toEqual({})
  })

  it('requires company, role and date applied', () => {
    const errors = validateDraft(normalizeDraft({ ...valid, company: '  ', role: '', dateApplied: '' }))
    expect(Object.keys(errors).sort()).toEqual(['company', 'dateApplied', 'role'])
  })

  it('rejects impossible dates', () => {
    expect(validateDraft({ ...valid, dateApplied: '2026-02-30' }).dateApplied).toBeDefined()
    expect(validateDraft({ ...valid, followUpDate: 'soon' }).followUpDate).toBeDefined()
  })

  it('normalizes and validates job links', () => {
    expect(normalizeUrl('jobs.example.com/123')).toBe('https://jobs.example.com/123')
    expect(normalizeUrl('http://example.com')).toBe('http://example.com')
    expect(validateDraft(normalizeDraft({ ...valid, jobUrl: 'example.com/jobs' }))).toEqual({})
    expect(validateDraft(normalizeDraft({ ...valid, jobUrl: 'javascript:alert(1)' })).jobUrl).toBeDefined()
    expect(validateDraft(normalizeDraft({ ...valid, jobUrl: 'not a url' })).jobUrl).toBeDefined()
  })
})
