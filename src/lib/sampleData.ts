import type { JobApplication } from '../types'
import { addDays } from './dates'
import { createId } from './storage'

type Sample = Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt' | 'dateApplied' | 'followUpDate'> & {
  appliedDaysAgo: number
  followUpInDays: number | null
}

const SAMPLES: Sample[] = [
  {
    company: 'Northwind Labs',
    role: 'Frontend Engineer',
    status: 'interviewing',
    jobUrl: 'https://example.com/careers/northwind-frontend',
    contact: 'Priya Shah (recruiter) · priya@example.com',
    notes: 'Technical screen went well. Next round is a system design interview.',
    appliedDaysAgo: 12,
    followUpInDays: 1,
  },
  {
    company: 'Acme Corp',
    role: 'Product Designer',
    status: 'applied',
    jobUrl: 'https://example.com/jobs/acme-design',
    contact: 'Jordan Lee',
    notes: 'Referred by a former colleague.',
    appliedDaysAgo: 9,
    followUpInDays: -2,
  },
  {
    company: 'Globex',
    role: 'Full Stack Developer',
    status: 'offer',
    jobUrl: 'https://example.com/globex/fullstack',
    contact: 'Sam Rivera · +1 555 0100',
    notes: 'Offer received. Decision due by end of next week.',
    appliedDaysAgo: 30,
    followUpInDays: 5,
  },
  {
    company: 'Initech',
    role: 'Software Engineer II',
    status: 'rejected',
    jobUrl: '',
    contact: '',
    notes: 'Position filled internally.',
    appliedDaysAgo: 21,
    followUpInDays: null,
  },
  {
    company: 'Umbrella Health',
    role: 'UX Engineer',
    status: 'saved',
    jobUrl: 'https://example.com/umbrella/ux-engineer',
    contact: '',
    notes: 'Tailor portfolio toward accessibility work before applying.',
    appliedDaysAgo: 0,
    followUpInDays: 3,
  },
]

export function createSampleApplications(today: string): JobApplication[] {
  const now = new Date().toISOString()
  return SAMPLES.map(({ appliedDaysAgo, followUpInDays, ...rest }) => ({
    ...rest,
    id: createId(),
    dateApplied: addDays(today, -appliedDaysAgo),
    followUpDate: followUpInDays === null ? '' : addDays(today, followUpInDays),
    createdAt: now,
    updatedAt: now,
  }))
}
