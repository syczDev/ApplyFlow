import { useId, useLayoutEffect, useRef, type ReactNode } from 'react'
import { CloseIcon } from './Icons'

interface ModalProps {
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
  size?: 'default' | 'small'
}

/**
 * Accessible modal built on the native <dialog> element, which provides focus
 * containment, Escape handling and an inert background. Mount it to open it;
 * unmount it to close it. Mark the element that should receive focus first with
 * `data-autofocus`.
 */
export function Modal({ title, description, onClose, children, size = 'default' }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descId = `${titleId}-desc`

  useLayoutEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    if (!dialog.open) dialog.showModal()
    // Prefer a marked starting point (e.g. the first form field) over the close button.
    dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    document.body.classList.add('modal-open')
    return () => {
      document.body.classList.remove('modal-open')
      if (dialog.open) dialog.close()
      if (previouslyFocused?.isConnected) previouslyFocused.focus()
    }
  }, [])

  return (
    <dialog
      ref={ref}
      className={`modal modal--${size}`}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(event) => {
        // Let React state drive closing so the dialog unmounts cleanly.
        event.preventDefault()
        onClose()
      }}
    >
      <div className="modal__header">
        <div>
          <h2 id={titleId} className="modal__title">
            {title}
          </h2>
          {description && (
            <p id={descId} className="modal__description">
              {description}
            </p>
          )}
        </div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Close dialog">
          <CloseIcon />
        </button>
      </div>
      {children}
    </dialog>
  )
}
