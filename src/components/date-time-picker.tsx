import { useId, useRef } from 'react'

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
  const inputRef = useRef<HTMLInputElement>(null)

  function openPicker() {
    if (disabled) return
    const el = inputRef.current
    if (!el) return
    if (typeof el.showPicker === 'function') {
      try {
        el.showPicker()
        return
      } catch {
        // fallthrough to focus
      }
    }
    el.focus()
    el.click()
  }

  const { date, time } = formatDisplay(value)
  const empty = !value

  return (
    <button
      type="button"
      id={id}
      disabled={disabled}
      aria-label={ariaLabel ?? 'Chọn ngày giờ'}
      onClick={openPicker}
      className="datetime-trigger"
    >
      <span className="datetime-values">
        <span className={`datetime-date${empty ? ' is-empty' : ''}`}>{date}</span>
        <span className="datetime-sep" aria-hidden="true">·</span>
        <span className={`datetime-time${empty ? ' is-empty' : ''}`}>{time}</span>
      </span>
      <span className="datetime-icon" aria-hidden="true">
        <i className="fas fa-calendar-days" />
      </span>
      <input
        ref={inputRef}
        type="datetime-local"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
        className="datetime-native"
      />
    </button>
  )
}
