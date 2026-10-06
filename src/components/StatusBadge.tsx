import { STATUS_LABELS, type Status } from '../types'

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`badge badge--${status}`}>
      <span className="badge__dot" aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  )
}
