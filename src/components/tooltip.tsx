import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface TooltipProps {
  content: ReactNode
  label?: string
  side?: 'top' | 'bottom' | 'auto'
  align?: 'start' | 'center' | 'end'
}

interface BubblePos {
  top: number
  left: number
  side: 'top' | 'bottom'
  arrowLeft: number
}

const GAP = 8
const VIEWPORT_PADDING = 8
const MAX_WIDTH = 240

// Tooltip rendered via React portal so it's never clipped by ancestor
// `overflow: auto/hidden`. Position is computed from the trigger rect each
// time it opens (and on scroll/resize while open).
export function Tooltip({ content, label = 'Giải thích', side = 'auto', align = 'center' }: TooltipProps) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<BubblePos | null>(null)
  const id = useId()
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const bubbleRef = useRef<HTMLDivElement | null>(null)

  function computePos() {
    const trigger = triggerRef.current
    const bubble = bubbleRef.current
    if (!trigger || !bubble) return

    const rect = trigger.getBoundingClientRect()
    const bubbleRect = bubble.getBoundingClientRect()
    const bw = bubbleRect.width || MAX_WIDTH
    const bh = bubbleRect.height
    const vw = window.innerWidth

    // Pick side: prefer top, fall back to bottom if not enough room above.
    let chosen: 'top' | 'bottom'
    if (side === 'auto') {
      const spaceAbove = rect.top
      chosen = spaceAbove >= bh + GAP + VIEWPORT_PADDING ? 'top' : 'bottom'
    } else {
      chosen = side
    }

    const top = chosen === 'top' ? rect.top - bh - GAP : rect.bottom + GAP
    const triggerCenterX = rect.left + rect.width / 2

    // Horizontal align: keep within viewport with a small padding.
    let leftIdeal: number
    if (align === 'start') leftIdeal = rect.left
    else if (align === 'end') leftIdeal = rect.right - bw
    else leftIdeal = triggerCenterX - bw / 2

    const left = Math.min(
      Math.max(VIEWPORT_PADDING, leftIdeal),
      Math.max(VIEWPORT_PADDING, vw - bw - VIEWPORT_PADDING),
    )

    const arrowLeft = Math.min(Math.max(triggerCenterX - left, 12), bw - 12)

    setPos({ top, left, side: chosen, arrowLeft })
  }

  useLayoutEffect(() => {
    if (!open) return
    computePos()
  }, [open])

  useEffect(() => {
    if (!open) return
    function onMove() {
      computePos()
    }
    function onDocPointer(e: Event) {
      const t = e.target as Node
      if (triggerRef.current?.contains(t)) return
      if (bubbleRef.current?.contains(t)) return
      setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('scroll', onMove, true)
    window.addEventListener('resize', onMove)
    document.addEventListener('mousedown', onDocPointer)
    document.addEventListener('touchstart', onDocPointer)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', onMove, true)
      window.removeEventListener('resize', onMove)
      document.removeEventListener('mousedown', onDocPointer)
      document.removeEventListener('touchstart', onDocPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`tip-trigger${open ? ' is-open' : ''}`}
        aria-label={label}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={(e) => {
          e.preventDefault()
          setOpen((v) => !v)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <i className="fas fa-circle-question" aria-hidden="true" />
      </button>
      {open && createPortal(
        <div
          ref={bubbleRef}
          id={id}
          role="tooltip"
          className={`tip-bubble tip-side-${pos?.side ?? 'top'}${pos ? ' is-positioned' : ''}`}
          style={pos ? { top: pos.top, left: pos.left } : { top: -9999, left: -9999 }}
        >
          <span className="tip-content">{content}</span>
          {pos && <span className="tip-arrow" style={{ left: pos.arrowLeft }} aria-hidden="true" />}
        </div>,
        document.body,
      )}
    </>
  )
}
