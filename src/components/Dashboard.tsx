import { computeStats, followUpState, upcomingFollowUps } from '../lib/applications'
import { describeRelative, formatDate } from '../lib/dates'
import { STATUSES, STATUS_LABELS, type JobApplication, type StatusFilter } from '../types'
import { AlertIcon, BellIcon } from './Icons'

interface DashboardProps {
  applications: JobApplication[]
  today: string
  onSelectStatus: (status: StatusFilter) => void
  onOpenApplication: (app: JobApplication) => void
}

export function Dashboard({ applications, today, onSelectStatus, onOpenApplication }: DashboardProps) {
  const stats = computeStats(applications, today)
  const followUps = upcomingFollowUps(applications, today)
  const maxCount = Math.max(1, ...STATUSES.map((s) => stats.byStatus[s]))

  const tiles = [
    { label: 'Total applications', value: stats.total, hint: 'All time' },
    { label: 'Active', value: stats.active, hint: 'Saved, applied or interviewing' },
    { label: 'Interviewing', value: stats.interviewing, hint: 'In progress now' },
    { label: 'Offers', value: stats.offers, hint: 'Received' },
    {
      label: 'Interview rate',
      value: stats.interviewRate === null ? '—' : `${stats.interviewRate}%`,
      hint: 'Submitted that reached interview or offer',
    },
    {
      label: 'Follow-ups due',
      value: stats.followUpsDue,
      hint: 'Today or overdue',
      tone: stats.followUpsDue > 0 ? 'attention' : undefined,
    },
  ]

  return (
    <section className="dashboard" aria-labelledby="dashboard-heading">
      <h2 id="dashboard-heading" className="section-title">
        Overview
      </h2>

      <ul className="stats" role="list">
        {tiles.map((tile) => (
          <li key={tile.label} className={`stat ${tile.tone ? `stat--${tile.tone}` : ''}`}>
            <span className="stat__label">{tile.label}</span>
            <span className="stat__value">{tile.value}</span>
            <span className="stat__hint">{tile.hint}</span>
          </li>
        ))}
      </ul>

      <div className="dashboard__panels">
        <div className="panel">
          <h3 className="panel__title" id="pipeline-heading">
            Pipeline by status
          </h3>
          <p className="panel__subtitle">Select a status to filter your list.</p>
          <ul className="pipeline" role="list" aria-labelledby="pipeline-heading">
            {STATUSES.map((status) => {
              const count = stats.byStatus[status]
              const share = stats.total ? Math.round((count / stats.total) * 100) : 0
              return (
                <li key={status}>
                  <button
                    type="button"
                    className="pipeline__row"
                    onClick={() => onSelectStatus(status)}
                    aria-label={`${STATUS_LABELS[status]}: ${count} ${count === 1 ? 'application' : 'applications'}, ${share}%. Show only ${STATUS_LABELS[status]}.`}
                  >
                    <span className="pipeline__label">{STATUS_LABELS[status]}</span>
                    <span className="pipeline__track" aria-hidden="true">
                      {count > 0 && (
                        <span className="pipeline__bar" style={{ width: `${(count / maxCount) * 100}%` }} />
                      )}
                    </span>
                    <span className="pipeline__count" aria-hidden="true">
                      {count}
                      <span className="pipeline__share">{share}%</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="panel">
          <h3 className="panel__title" id="followups-heading">
            Upcoming follow-ups
          </h3>
          <p className="panel__subtitle">Closed applications are hidden here.</p>
          {followUps.length === 0 ? (
            <div className="panel__empty">
              <BellIcon className="panel__empty-icon" />
              <p>No follow-ups scheduled. Add a follow-up date to an application to get a reminder here.</p>
            </div>
          ) : (
            <ul className="followups" role="list" aria-labelledby="followups-heading">
              {followUps.map((app) => {
                const state = followUpState(app, today)
                return (
                  <li key={app.id}>
                    <button
                      type="button"
                      className={`followup followup--${state}`}
                      onClick={() => onOpenApplication(app)}
                    >
                      <span className="followup__main">
                        <span className="followup__company">{app.company}</span>
                        <span className="followup__role">{app.role}</span>
                      </span>
                      <span className="followup__when">
                        {state === 'overdue' && <AlertIcon className="followup__icon" />}
                        <span>
                          {state === 'overdue' ? 'Overdue · ' : ''}
                          <time dateTime={app.followUpDate} title={formatDate(app.followUpDate)}>
                            {describeRelative(app.followUpDate, today)}
                          </time>
                        </span>
                      </span>
                      <span className="visually-hidden">, edit application</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
