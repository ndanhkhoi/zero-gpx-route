import type { CSSProperties, ReactNode } from 'react'
import { Tooltip } from './tooltip'

interface SliderFieldProps {
  label: string
  icon?: string
  unit?: string
  hint?: ReactNode
  min: number
  max: number
  step: number
  value: number
  disabled?: boolean
  onChange: (value: number) => void
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function SliderField({ label, icon, unit, hint, min, max, step, value, disabled, onChange }: SliderFieldProps) {
  const ratio = max > min ? ((value - min) / (max - min)) * 100 : 0
  const fillStyle = { '--slider-fill': `${clamp(ratio, 0, 100)}%` } as CSSProperties

  return (
    <div className="setting-card setting-slider">
      <div className="setting-head">
        <div className="setting-label">
          {icon && (
            <span className="setting-icon" aria-hidden="true">
              <i className={`fas ${icon}`} />
            </span>
          )}
          <span>{label}</span>
          {hint && <Tooltip content={hint} label={`Giải thích: ${label}`} />}
        </div>
        <div className="setting-value">
          <input
            type="number"
            lang="en"
            min={min}
            max={max}
            step={step}
            value={value}
            disabled={disabled}
            className="setting-value-input"
            onChange={(e) => {
              const num = parseFloat(e.target.value)
              if (!Number.isFinite(num)) return
              onChange(clamp(num, min, max))
            }}
            onBlur={(e) => {
              const num = parseFloat(e.target.value)
              onChange(clamp(Number.isFinite(num) ? num : min, min, max))
            }}
          />
          {unit && <span className="setting-unit">{unit}</span>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        className="setting-range"
        style={fillStyle}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  )
}
