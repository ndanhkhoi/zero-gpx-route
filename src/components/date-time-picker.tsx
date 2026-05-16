import { useId } from 'react'

interface DateTimePickerProps {
  value: string
  disabled?: boolean
  onChange: (value: string) => void
  ariaLabel?: string
}

function formatDisplay(value: string): { date: string; time: string } {
  if (!value) return { date: '—', time: '—' }
  const [datePart = '', timePart = ''] = value.split('T')
  const [y, m, d] = datePart.split('-')
  const [hh, mm] = timePart.split(':')
  const date = y && m && d ? `${d}/${m}/${y}` : '—'
  const time = hh && mm ? `${hh}:${mm}` : '—'
  return { date, time }
}

export function DateTimePicker({ value, disabled, onChange, ariaLabel }: DateTimePickerProps) {
  const id = useId()
  const { date, time } = formatDisplay(value)
  const empty = !value

  // The native <input> sits on top with opacity:0 so iOS Safari gets a real
  // user tap on the input itself, which is the only way to open the native
  // datetime picker on mobile Safari (showPicker() / .click() via JS won't
  // satisfy iOS' user-activation check).
  return (
    <label htmlFor={id} className={`datetime-trigger${disabled ? ' is-disabled' : ''}`}>
      <span className="datetime-values">
        <span className={`datetime-date${empty ? ' is-empty' : ''}`}>{date}</span>
        <span className="datetime-sep" aria-hidden="true">·</span>
        <span className={`datetime-time${empty ? ' is-empty' : ''}`}>{time}</span>
      </span>
      <span className="datetime-icon" aria-hidden="true">
        <i className="fas fa-calendar-days" />
      </span>
      <input
        id={id}
        type="datetime-local"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel ?? 'Chọn ngày giờ'}
        className="datetime-native"
      />
    </label>
  )
}
