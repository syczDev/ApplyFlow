import { useEffect } from 'react'
import { CloseIcon } from './Icons'

export interface ToastMessage {
  id: number
  text: string
  tone?: 'success' | 'error'
}

interface ToastProps {
  message: ToastMessage | null
  onDismiss: () => void
}

/**
 * The live region is always rendered so screen readers reliably announce
 * messages inserted into it.
 */
export function Toast({ message, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(onDismiss, 5000)
    return () => window.clearTimeout(timer)
  }, [message, onDismiss])

  return (
    <div className="toast-region" role="status" aria-live="polite">
      {message && (
        <div key={message.id} className={`toast toast--${message.tone ?? 'success'}`}>
          <span>{message.text}</span>
          <button type="button" className="icon-button" onClick={onDismiss} aria-label="Dismiss notification">
            <CloseIcon />
          </button>
        </div>
      )}
    </div>
  )
}
