import { followUpState } from '../lib/applications'
import { describeRelative, formatDate } from '../lib/dates'
import { STATUSES, STATUS_LABELS, type JobApplication, type Status } from '../types'
import { AlertIcon, BellIcon, CalendarIcon, EditIcon, LinkIcon, TrashIcon, UserIcon } from './Icons'
import { StatusBadge } from './StatusBadge'

interface ApplicationCardProps {
  app: JobApplication
  today: string
  onEdit: (app: JobApplication) => void
  onDelete: (app: JobApplication) => void
  onStatusChange: (id: string, status: Status) => void
}

function displayHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function ApplicationCard({ app, today, onEdit, onDelete, onStatusChange }: ApplicationCardProps) {
  const followUp = followUpState(app, today)
  const headingId = `app-${app.id}-title`
  const statusId = `app-${app.id}-status`
  const name = `${app.company}, ${app.role}`

  return (
    <article className={`card card--${app.status}`} aria-labelledby={headingId}>
      <header className="card__header">
        <div className="card__titles">
          <h3 id={headingId} className="card__company">
            {app.company}
          </h3>
          <p className="card__role">{app.role}</p>
        </div>
        <StatusBadge status={app.status} />
      </header>

      <dl className="card__meta">
        <div className="meta">
          <dt>
            <CalendarIcon className="meta__icon" />
            <span className="visually-hidden">Date applied</span>
          </dt>
          <dd>
            {app.dateApplied ? (
              <>
                {app.status === 'saved' ? 'Added ' : 'Applied '}
                <time dateTime={app.dateApplied}>{formatDate(app.dateApplied)}</time>
              </>
            ) : (
              <span className="muted">No date</span>
            )}
          </dd>
        </div>

        {app.followUpDate && (
          <div className={`meta ${followUp ? `meta--${followUp}` : ''}`}>
            <dt>
              {followUp === 'overdue' ? (
                <AlertIcon className="meta__icon" />
              ) : (
                <BellIcon className="meta__icon" />
              )}
              <span className="visually-hidden">Next follow-up</span>
            </dt>
            <dd>
              {followUp === 'overdue' && <strong>Overdue: </strong>}
              Follow up{' '}
              <time dateTime={app.followUpDate}>{formatDate(app.followUpDate)}</time>
              {followUp && (
                <span className="muted"> ({describeRelative(app.followUpDate, today)})</span>
              )}
            </dd>
          </div>
        )}

        {app.contact && (
          <div className="meta">
            <dt>
              <UserIcon className="meta__icon" />
              <span className="visually-hidden">Contact</span>
            </dt>
            <dd className="meta__wrap">{app.contact}</dd>
          </div>
        )}

        {app.jobUrl && (
          <div className="meta">
            <dt>
              <LinkIcon className="meta__icon" />
              <span className="visually-hidden">Job link</span>
            </dt>
            <dd>
              <a href={app.jobUrl} target="_blank" rel="noopener noreferrer" className="card__link">
                {displayHost(app.jobUrl)}
                <span className="visually-hidden"> (job posting for {name}, opens in a new tab)</span>
              </a>
            </dd>
          </div>
        )}
      </dl>

      {app.notes && <p className="card__notes">{app.notes}</p>}

      <footer className="card__footer">
        <div className="card__status">
          <label htmlFor={statusId} className="visually-hidden">
            Status for {name}
          </label>
          <select
            id={statusId}
            className="select--compact"
            value={app.status}
            onChange={(e) => onStatusChange(app.id, e.target.value as Status)}
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
        <div className="card__actions">
          <button
            type="button"
            className="button button--ghost button--small"
            onClick={() => onEdit(app)}
            aria-label={`Edit ${name}`}
          >
            <EditIcon /> <span aria-hidden="true">Edit</span>
          </button>
          <button
            type="button"
            className="button button--ghost-danger button--small"
            onClick={() => onDelete(app)}
            aria-label={`Delete ${name}`}
          >
            <TrashIcon /> <span aria-hidden="true">Delete</span>
          </button>
        </div>
      </footer>
    </article>
  )
}
