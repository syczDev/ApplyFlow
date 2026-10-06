import { useCallback, useEffect, useRef, useState } from 'react'
import type { ApplicationDraft, JobApplication, Status } from '../types'
import { createId, loadApplications, saveApplications, STORAGE_KEY } from '../lib/storage'

export function useApplications() {
  const [initial] = useState(loadApplications)
  const [applications, setApplications] = useState<JobApplication[]>(initial.applications)
  const [storageError, setStorageError] = useState<string | undefined>(initial.error)
  // Only write after a user change, so unreadable stored data is never silently replaced on load.
  const dirty = useRef(false)

  useEffect(() => {
    if (!dirty.current) return
    const ok = saveApplications(applications)
    setStorageError(ok ? undefined : 'Your latest changes could not be saved to this browser.')
  }, [applications])

  // Keep multiple open tabs in sync.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY && event.key !== null) return
      const result = loadApplications()
      dirty.current = false
      setApplications(result.applications)
      setStorageError(result.error)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const mutate = useCallback((fn: (prev: JobApplication[]) => JobApplication[]) => {
    dirty.current = true
    setApplications(fn)
  }, [])

  const add = useCallback(
    (draft: ApplicationDraft): JobApplication => {
      const now = new Date().toISOString()
      const app: JobApplication = { ...draft, id: createId(), createdAt: now, updatedAt: now }
      mutate((prev) => [app, ...prev])
      return app
    },
    [mutate],
  )

  const update = useCallback(
    (id: string, changes: Partial<ApplicationDraft>) => {
      const now = new Date().toISOString()
      mutate((prev) =>
        prev.map((app) => (app.id === id ? { ...app, ...changes, updatedAt: now } : app)),
      )
    },
    [mutate],
  )

  const setStatus = useCallback(
    (id: string, status: Status) => update(id, { status }),
    [update],
  )

  const remove = useCallback(
    (id: string) => mutate((prev) => prev.filter((app) => app.id !== id)),
    [mutate],
  )

  const addMany = useCallback(
    (apps: JobApplication[]) => mutate((prev) => [...apps, ...prev]),
    [mutate],
  )

  const clearAll = useCallback(() => mutate(() => []), [mutate])

  return { applications, storageError, add, update, setStatus, remove, addMany, clearAll }
}
