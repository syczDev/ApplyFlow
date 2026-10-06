import { STATUSES, STATUS_LABELS, type SortKey, type Status, type StatusFilter } from '../types'
import { CloseIcon, SearchIcon } from './Icons'

interface ToolbarProps {
  query: string
  onQueryChange: (query: string) => void
  status: StatusFilter
  onStatusChange: (status: StatusFilter) => void
  sort: SortKey
  onSortChange: (sort: SortKey) => void
  counts: Record<Status, number>
  total: number
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'applied-desc', label: 'Newest applied' },
  { value: 'applied-asc', label: 'Oldest applied' },
  { value: 'follow-up', label: 'Next follow-up' },
  { value: 'company', label: 'Company A–Z' },
]

export function Toolbar({
  query,
  onQueryChange,
  status,
  onStatusChange,
  sort,
  onSortChange,
  counts,
  total,
}: ToolbarProps) {
  const filters: { value: StatusFilter; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: total },
    ...STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s], count: counts[s] })),
  ]

  return (
    <div className="toolbar">
      <div className="toolbar__row">
        <div className="search" role="search">
          <label htmlFor="search-input" className="visually-hidden">
            Search applications
          </label>
          <SearchIcon className="search__icon" />
          <input
            id="search-input"
            type="search"
            className="search__input"
            placeholder="Search company, role, contact or notes"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && query) {
                e.preventDefault()
                onQueryChange('')
              }
            }}
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              className="search__clear icon-button"
              onClick={() => {
                onQueryChange('')
                document.getElementById('search-input')?.focus()
              }}
              aria-label="Clear search"
            >
              <CloseIcon />
            </button>
          )}
        </div>

        <div className="sort">
          <label htmlFor="sort-select" className="sort__label">
            Sort by
          </label>
          <select
            id="sort-select"
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortKey)}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="filters" role="group" aria-label="Filter by status">
        {filters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            className="chip"
            aria-pressed={status === filter.value}
            onClick={() => onStatusChange(filter.value)}
          >
            {filter.label}
            <span className="chip__count">
              <span className="visually-hidden">(</span>
              {filter.count}
              <span className="visually-hidden">)</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
