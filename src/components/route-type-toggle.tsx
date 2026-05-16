import type { RouteType } from '../types/route'

interface RouteTypeToggleProps {
  value: RouteType
  disabled?: boolean
  onChange: (value: RouteType) => void
}

const OPTIONS: { value: RouteType; label: string; icon: string }[] = [
  { value: 'run', label: 'Chạy bộ', icon: 'fa-person-running' },
  { value: 'walk', label: 'Đi bộ', icon: 'fa-person-walking' },
]

export function RouteTypeToggle({ value, disabled, onChange }: RouteTypeToggleProps) {
  return (
    <div className="route-type-toggle">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={disabled}
          className={`route-type-btn${value === opt.value ? ' active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          <i className={`fas ${opt.icon}`} aria-hidden="true" />
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  )
}
