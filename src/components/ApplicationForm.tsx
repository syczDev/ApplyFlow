import { useId, useState, type ChangeEvent, type FormEvent } from 'react'
import { normalizeDraft, validateDraft, type DraftErrors } from '../lib/applications'
import { STATUSES, STATUS_LABELS, type ApplicationDraft } from '../types'

interface ApplicationFormProps {
  initial: ApplicationDraft
  submitLabel: string
  onSubmit: (draft: ApplicationDraft) => void
  onCancel: () => void
}

const FIELD_ORDER: (keyof ApplicationDraft)[] = [
  'company',
  'role',
  'status',
  'dateApplied',
  'followUpDate',
  'jobUrl',
  'contact',
  'notes',
]

export function ApplicationForm({ initial, submitLabel, onSubmit, onCancel }: ApplicationFormProps) {
  const [draft, setDraft] = useState<ApplicationDraft>(initial)
  const [errors, setErrors] = useState<DraftErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const uid = useId()
  const id = (name: keyof ApplicationDraft) => `${uid}-${name}`

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target
    const next = { ...draft, [name]: value }
    setDraft(next)
    // After the first submit attempt, re-validate live so errors clear as they are fixed.
    if (submitted) setErrors(validateDraft(normalizeDraft(next)))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    const normalized = normalizeDraft(draft)
    const nextErrors = validateDraft(normalized)
    setErrors(nextErrors)
    const firstInvalid = FIELD_ORDER.find((name) => nextErrors[name])
    if (firstInvalid) {
      document.getElementById(id(firstInvalid))?.focus()
      return
    }
    onSubmit(normalized)
  }

  const errorCount = Object.keys(errors).length

  const fieldProps = (name: keyof ApplicationDraft) => ({
    id: id(name),
    name,
    value: draft[name],
    onChange: handleChange,
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby':
      [errors[name] ? `${id(name)}-error` : '', hints[name] ? `${id(name)}-hint` : '']
        .filter(Boolean)
        .join(' ') || undefined,
  })

  const hints: Partial<Record<keyof ApplicationDraft, string>> = {
    jobUrl: 'Link to the job posting.',
    contact: 'Recruiter or hiring manager — name, email, or phone.',
    followUpDate: 'You’ll see a reminder on the dashboard when it’s due.',
  }

  const renderMessages = (name: keyof ApplicationDraft) => (
    <>
      {hints[name] && (
        <p id={`${id(name)}-hint`} className="field__hint">
          {hints[name]}
        </p>
      )}
      {errors[name] && (
        <p id={`${id(name)}-error`} className="field__error">
          {errors[name]}
        </p>
      )}
    </>
  )

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <div className="form__body">
        <p className="form__required-note">
          Fields marked <span aria-hidden="true">*</span>
          <span className="visually-hidden">with an asterisk</span> are required.
        </p>

        <div role="alert" className="form__summary" hidden={errorCount === 0}>
          {errorCount > 0 &&
            `Please fix ${errorCount} ${errorCount === 1 ? 'field' : 'fields'} before saving.`}
        </div>

        <div className="form__grid">
          <div className="field">
            <label htmlFor={id('company')}>
              Company <span className="field__required" aria-hidden="true">*</span>
            </label>
            <input type="text" autoComplete="organization" required data-autofocus {...fieldProps('company')} />
            {renderMessages('company')}
          </div>

          <div className="field">
            <label htmlFor={id('role')}>
              Role <span className="field__required" aria-hidden="true">*</span>
            </label>
            <input type="text" autoComplete="organization-title" required {...fieldProps('role')} />
            {renderMessages('role')}
          </div>

          <div className="field">
            <label htmlFor={id('status')}>Status</label>
            <select {...fieldProps('status')}>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor={id('dateApplied')}>
              Date applied <span className="field__required" aria-hidden="true">*</span>
            </label>
            <input type="date" required {...fieldProps('dateApplied')} />
            {renderMessages('dateApplied')}
          </div>

          <div className="field">
            <label htmlFor={id('followUpDate')}>Next follow-up</label>
            <input type="date" {...fieldProps('followUpDate')} />
            {renderMessages('followUpDate')}
          </div>

          <div className="field">
            <label htmlFor={id('jobUrl')}>Job link</label>
            <input
              type="url"
              inputMode="url"
              placeholder="https://"
              autoComplete="url"
              {...fieldProps('jobUrl')}
            />
            {renderMessages('jobUrl')}
          </div>

          <div className="field field--full">
            <label htmlFor={id('contact')}>Contact</label>
            <input type="text" {...fieldProps('contact')} />
            {renderMessages('contact')}
          </div>

          <div className="field field--full">
            <label htmlFor={id('notes')}>Notes</label>
            <textarea rows={4} {...fieldProps('notes')} />
          </div>
        </div>
      </div>

      <div className="form__actions">
        <button type="button" className="button button--secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="button button--primary">
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
