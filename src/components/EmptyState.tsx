import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  children: ReactNode
  actions?: ReactNode
}

export function EmptyState({ icon, title, children, actions }: EmptyStateProps) {
  return (
    <div className="empty">
      <div className="empty__icon" aria-hidden="true">
        {icon}
      </div>
      <h3 className="empty__title">{title}</h3>
      <div className="empty__body">{children}</div>
      {actions && <div className="empty__actions">{actions}</div>}
    </div>
  )
}
