import { useEffect, useState, type ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  size?: 'sm' | 'md'
  labelledBy?: string
  closeOnBackdrop?: boolean
  closeOnEscape?: boolean
}

const TRANSITION_MS = 320

// Base modal primitive:
// - mounts on open, waits a frame, applies `.open` class so CSS transition runs
// - on close, removes class first, unmounts after the transition finishes
// - handles ESC and backdrop click via the optional flags
export function Modal({
  isOpen,
  onClose,
  children,
  size = 'sm',
  labelledBy,
  closeOnBackdrop = true,
  closeOnEscape = true,
}: ModalProps) {
  const [shouldRender, setShouldRender] = useState(false)
  const [animateOpen, setAnimateOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
      // Double rAF guarantees the browser paints the pre-open state once
      // before the `.is-open` class flips, so the CSS transition runs.
      let raf2 = 0
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setAnimateOpen(true))
      })
      return () => {
        cancelAnimationFrame(raf1)
        if (raf2) cancelAnimationFrame(raf2)
      }
    }
    setAnimateOpen(false)
    const t = window.setTimeout(() => setShouldRender(false), TRANSITION_MS)
    return () => window.clearTimeout(t)
  }, [isOpen])

  useEffect(() => {
    if (!shouldRender || !closeOnEscape) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [shouldRender, closeOnEscape, onClose])

  if (!shouldRender) return null

  return (
    <div
      className={`app-modal-overlay${animateOpen ? ' is-open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      onClick={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose()
      }}
    >
      <div className={`app-modal app-modal-${size}`}>{children}</div>
    </div>
  )
}
