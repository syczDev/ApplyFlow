import { useCallback, useMemo, useRef, useState } from 'react'
import { ApplicationCard } from './components/ApplicationCard'
import { ApplicationForm } from './components/ApplicationForm'
import { ConfirmDialog } from './components/ConfirmDialog'
import { Dashboard } from './components/Dashboard'
import { EmptyState } from './components/EmptyState'
import { AlertIcon, BriefcaseIcon, LogoMark, PlusIcon, SearchIcon } from './components/Icons'
import { Modal } from './components/Modal'
import { Toast, type ToastMessage } from './components/Toast'
import { Toolbar } from './components/Toolbar'
import { useApplications } from './hooks/useApplications'
import { useToday } from './hooks/useToday'
import { computeStats, filterApplications, sortApplications } from './lib/applications'
import { createSampleApplications } from './lib/sampleData'
import {
  STATUS_LABELS,
  type ApplicationDraft,
  type JobApplication,
  type SortKey,
  type StatusFilter,
} from './types'

type DialogState =
  | { type: 'add' }
  | { type: 'edit'; app: JobApplication }
  | { type: 'delete'; app: JobApplication }
  | { type: 'clear' }
  | null

function emptyDraft(today: string): ApplicationDraft {
  return {
    company: '',
    role: '',
    dateApplied: today,
    status: 'applied',
    jobUrl: '',
    contact: '',
    followUpDate: '',
    notes: '',
  }
}

function toDraft(app: JobApplication): ApplicationDraft {
  const { id: _id, createdAt: _c, updatedAt: _u, ...draft } = app
  return draft
}

export default function App() {
  const { applications, storageError, add, update, setStatus, remove, addMany, clearAll } =
    useApplications()
  const today = useToday()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<SortKey>('applied-desc')
  const [dialog, setDialog] = useState<DialogState>(null)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const listHeadingRef = useRef<HTMLHeadingElement>(null)
  const toastId = useRef(0)

  const notify = useCallback((text: string, tone: ToastMessage['tone'] = 'success') => {
    toastId.current += 1
    setToast({ id: toastId.current, text, tone })
  }, [])
  const dismissToast = useCallback(() => setToast(null), [])
  const closeDialog = () => setDialog(null)

  // If the control that opened a dialog no longer exists (deleted card, replaced empty
  // state), move focus to the list heading instead of leaving it on <body>.
  const keepFocusInPage = () =>
    requestAnimationFrame(() => {
      if (!document.activeElement || document.activeElement === document.body) {
        listHeadingRef.current?.focus()
      }
    })

  const counts = useMemo(() => computeStats(applications, today).byStatus, [applications, today])
  const visible = useMemo(
    () => sortApplications(filterApplications(applications, query, statusFilter), sort),
    [applications, query, statusFilter, sort],
  )
  const isFiltered = query.trim() !== '' || statusFilter !== 'all'

  const clearFilters = () => {
    setQuery('')
    setStatusFilter('all')
  }

  const showStatus = (status: StatusFilter) => {
    setStatusFilter(status)
    listHeadingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    listHeadingRef.current?.focus({ preventScroll: true })
  }

  const handleSave = (draft: ApplicationDraft) => {
    if (dialog?.type === 'edit') {
      update(dialog.app.id, draft)
      notify(`Saved changes to ${draft.company}.`)
    } else {
      add(draft)
      notify(`Added ${draft.company} — ${draft.role}.`)
    }
    setDialog(null)
    keepFocusInPage()
  }

  const handleDelete = (app: JobApplication) => {
    remove(app.id)
    setDialog(null)
    notify(`Deleted ${app.company} — ${app.role}.`)
    keepFocusInPage()
  }

  const handleStatusChange = (id: string, status: JobApplication['status']) => {
    const app = applications.find((a) => a.id === id)
    setStatus(id, status)
    if (app) notify(`${app.company} moved to ${STATUS_LABELS[status]}.`)
  }

  const loadSamples = () => {
    addMany(createSampleApplications(today))
    notify('Added 5 sample applications. Edit or delete them any time.')
  }

  const resultsText = isFiltered
    ? `Showing ${visible.length} of ${applications.length} ${applications.length === 1 ? 'application' : 'applications'}`
    : `${applications.length} ${applications.length === 1 ? 'application' : 'applications'}`

  return (
    <>
      <a className="skip-link" href="#applications-heading">
        Skip to applications
      </a>

      <header className="app-header">
        <div className="container app-header__inner">
          <div className="brand">
            <LogoMark className="brand__mark" />
            <div>
              <h1 className="brand__name">ApplyFlow</h1>
              <p className="brand__tagline">Your job search, organized.</p>
            </div>
          </div>
          <button type="button" className="button button--primary" onClick={() => setDialog({ type: 'add' })}>
            <PlusIcon />
            <span>
              Add <span className="hide-sm">application</span>
            </span>
          </button>
        </div>
      </header>

      <main className="container main" id="main">
        {storageError && (
          <div className="banner" role="alert">
            <AlertIcon className="banner__icon" />
            <p>{storageError}</p>
          </div>
        )}

        {applications.length > 0 && (
          <Dashboard
            applications={applications}
            today={today}
            onSelectStatus={showStatus}
            onOpenApplication={(app) => setDialog({ type: 'edit', app })}
          />
        )}

        <section className="applications" aria-labelledby="applications-heading">
          <div className="applications__header">
            <h2 id="applications-heading" className="section-title" ref={listHeadingRef} tabIndex={-1}>
              Applications
            </h2>
            {applications.length > 0 && (
              <p className="applications__count" aria-live="polite" aria-atomic="true">
                {resultsText}
              </p>
            )}
          </div>

          {applications.length === 0 ? (
            <EmptyState
              icon={<BriefcaseIcon />}
              title="Start tracking your job search"
              actions={
                <>
                  <button type="button" className="button button--primary" onClick={() => setDialog({ type: 'add' })}>
                    <PlusIcon /> Add your first application
                  </button>
                  <button type="button" className="button button--secondary" onClick={loadSamples}>
                    Try with sample data
                  </button>
                </>
              }
            >
              <p>
                Keep every application, contact and follow-up in one place. Your data stays in this browser —
                no account needed.
              </p>
            </EmptyState>
          ) : (
            <>
              <Toolbar
                query={query}
                onQueryChange={setQuery}
                status={statusFilter}
                onStatusChange={setStatusFilter}
                sort={sort}
                onSortChange={setSort}
                counts={counts}
                total={applications.length}
              />

              {visible.length === 0 ? (
                <EmptyState
                  icon={<SearchIcon />}
                  title="No matching applications"
                  actions={
                    <button type="button" className="button button--secondary" onClick={clearFilters}>
                      Clear search and filters
                    </button>
                  }
                >
                  <p>
                    {query.trim() ? (
                      <>
                        Nothing matches “{query.trim()}”
                        {statusFilter !== 'all' && <> in {STATUS_LABELS[statusFilter]}</>}.
                      </>
                    ) : (
                      <>You have no applications marked {statusFilter === 'all' ? '' : STATUS_LABELS[statusFilter]}.</>
                    )}{' '}
                    Try a different search or status.
                  </p>
                </EmptyState>
              ) : (
                <ul className="card-grid" role="list">
                  {visible.map((app) => (
                    <li key={app.id}>
                      <ApplicationCard
                        app={app}
                        today={today}
                        onEdit={(a) => setDialog({ type: 'edit', app: a })}
                        onDelete={(a) => setDialog({ type: 'delete', app: a })}
                        onStatusChange={handleStatusChange}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>
      </main>

      <footer className="app-footer">
        <div className="container app-footer__inner">
          <p>Your applications are stored only in this browser’s local storage.</p>
          {applications.length > 0 && (
            <button type="button" className="button button--link" onClick={() => setDialog({ type: 'clear' })}>
              Clear all data
            </button>
          )}
        </div>
      </footer>

      {(dialog?.type === 'add' || dialog?.type === 'edit') && (
        <Modal
          title={dialog.type === 'add' ? 'Add application' : `Edit ${dialog.app.company}`}
          onClose={closeDialog}
        >
          <ApplicationForm
            initial={dialog.type === 'edit' ? toDraft(dialog.app) : emptyDraft(today)}
            submitLabel={dialog.type === 'add' ? 'Add application' : 'Save changes'}
            onSubmit={handleSave}
            onCancel={closeDialog}
          />
        </Modal>
      )}

      {dialog?.type === 'delete' && (
        <ConfirmDialog
          title="Delete application?"
          message={`${dialog.app.company} — ${dialog.app.role} will be permanently removed. This can’t be undone.`}
          confirmLabel="Delete"
          onConfirm={() => handleDelete(dialog.app)}
          onCancel={closeDialog}
        />
      )}

      {dialog?.type === 'clear' && (
        <ConfirmDialog
          title="Clear all data?"
          message={`All ${applications.length} applications will be permanently removed from this browser. This can’t be undone.`}
          confirmLabel="Clear all data"
          onConfirm={() => {
            clearAll()
            clearFilters()
            setDialog(null)
            notify('All applications were removed.')
            keepFocusInPage()
          }}
          onCancel={closeDialog}
        />
      )}

      <Toast message={toast} onDismiss={dismissToast} />
    </>
  )
}
