import { Modal } from './Modal'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal title={title} description={message} onClose={onCancel} size="small">
      <div className="form__actions">
        <button type="button" data-autofocus className="button button--secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="button button--danger" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
