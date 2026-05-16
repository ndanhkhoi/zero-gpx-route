import maplibregl from 'maplibre-gl'
import { useEffect, useRef } from 'react'
import type { LatLng } from '../types/route'

const STROKE_PIXEL_STEP = 6
const TAP_PIXEL_THRESHOLD = 6
const TAP_TIME_THRESHOLD_MS = 350

interface UseDrawingArgs {
  map: maplibregl.Map | null
  isDrawing: boolean
  appendAnchor: (point: LatLng) => string
  startStroke: (point: LatLng) => string
  appendStrokePoint: (id: string, point: LatLng) => void
  moveAnchor: (id: string, point: LatLng) => void
  removeAnchor: (id: string) => void
  anchors: { id: string; point: LatLng }[]
}

export function useDrawing({
  map,
  isDrawing,
  appendAnchor,
  startStroke,
  appendStrokePoint,
  moveAnchor,
  removeAnchor,
  anchors,
}: UseDrawingArgs) {
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map())

  // Cursor feedback
  useEffect(() => {
    if (!map) return
    map.getCanvas().style.cursor = isDrawing ? 'crosshair' : ''
  }, [map, isDrawing])

  // Reconcile draggable anchor markers with current anchors.
  // Click marker → remove anchor (only when in drawing mode).
  useEffect(() => {
    if (!map) return
    const existing = markersRef.current
    const wantedIds = new Set(anchors.map((a) => a.id))

    for (const [id, marker] of existing) {
      if (!wantedIds.has(id)) {
        marker.remove()
        existing.delete(id)
      }
    }

    for (const anchor of anchors) {
      const marker = existing.get(anchor.id)
      if (marker) {
        const lngLat = marker.getLngLat()
        if (lngLat.lat !== anchor.point.lat || lngLat.lng !== anchor.point.lng) {
          marker.setLngLat([anchor.point.lng, anchor.point.lat])
        }
        continue
      }

      const el = document.createElement('div')
      el.className = 'route-marker'
      el.title = 'Kéo để di chuyển · Bấm để xoá'
      el.innerHTML = '<div class="marker-dot"></div>'

      let didDrag = false

      const created = new maplibregl.Marker({ element: el, draggable: true })
        .setLngLat([anchor.point.lng, anchor.point.lat])
        .addTo(map)

      created.on('dragstart', () => {
        didDrag = true
      })

      created.on('dragend', () => {
        const ll = created.getLngLat()
        moveAnchor(anchor.id, { lat: ll.lat, lng: ll.lng })
        // Reset on next tick so the click event after dragend doesn't fire delete.
        setTimeout(() => {
          didDrag = false
        }, 0)
      })

      el.addEventListener('click', (e) => {
        e.stopPropagation()
        if (didDrag) return
        removeAnchor(anchor.id)
      })

      existing.set(anchor.id, created)
    }
  }, [map, anchors, moveAnchor, removeAnchor])

  // Unified pointer-based gesture: tap → anchor, drag → stroke.
  useEffect(() => {
    if (!map || !isDrawing) return
    const canvas = map.getCanvasContainer()

    let activeStrokeId: string | null = null
    let downAt: { x: number; y: number; t: number } | null = null
    let lastStrokePixel: { x: number; y: number } | null = null
    let downLatLng: LatLng | null = null
    let isStroke = false
    let pointerType: 'mouse' | 'touch' = 'mouse'

    function getRect() {
      return map!.getCanvas().getBoundingClientRect()
    }
    function unproject(clientX: number, clientY: number): LatLng {
      const rect = getRect()
      const ll = map!.unproject([clientX - rect.left, clientY - rect.top])
      return { lat: ll.lat, lng: ll.lng }
    }
    function isOnMarker(target: EventTarget | null): boolean {
      if (!(target instanceof Element)) return false
      return Boolean(target.closest('.route-marker'))
    }

    function beginDown(clientX: number, clientY: number, type: 'mouse' | 'touch') {
      downAt = { x: clientX, y: clientY, t: Date.now() }
      lastStrokePixel = { x: clientX, y: clientY }
      downLatLng = unproject(clientX, clientY)
      isStroke = false
      pointerType = type
      activeStrokeId = null
      map!.dragPan.disable()
    }

    function maybePromoteToStroke(clientX: number, clientY: number) {
      if (!downAt || !downLatLng) return
      if (isStroke) return
      const dx = clientX - downAt.x
      const dy = clientY - downAt.y
      if (dx * dx + dy * dy < TAP_PIXEL_THRESHOLD * TAP_PIXEL_THRESHOLD) return
      isStroke = true
      activeStrokeId = startStroke(downLatLng)
    }

    function pushStrokePoint(clientX: number, clientY: number) {
      if (!activeStrokeId || !lastStrokePixel) return
      const dx = clientX - lastStrokePixel.x
      const dy = clientY - lastStrokePixel.y
      if (dx * dx + dy * dy < STROKE_PIXEL_STEP * STROKE_PIXEL_STEP) return
      appendStrokePoint(activeStrokeId, unproject(clientX, clientY))
      lastStrokePixel = { x: clientX, y: clientY }
    }

    function finishUp() {
      if (!downAt || !downLatLng) {
        map!.dragPan.enable()
        return
      }
      const elapsed = Date.now() - downAt.t
      // Only treat as anchor if it's a quick tap. Long press without movement
      // is silently cancelled to avoid surprise placements.
      if (!isStroke && elapsed < TAP_TIME_THRESHOLD_MS) {
        appendAnchor(downLatLng)
      }
      reset()
    }

    function reset() {
      downAt = null
      downLatLng = null
      lastStrokePixel = null
      isStroke = false
      activeStrokeId = null
      map!.dragPan.enable()
    }

    function onMouseDown(e: MouseEvent) {
      if (e.button !== 0) return
      if (isOnMarker(e.target)) return
      beginDown(e.clientX, e.clientY, 'mouse')
    }
    function onMouseMove(e: MouseEvent) {
      if (!downAt) return
      maybePromoteToStroke(e.clientX, e.clientY)
      if (isStroke) pushStrokePoint(e.clientX, e.clientY)
    }
    function onMouseUp() {
      if (pointerType !== 'mouse') return
      finishUp()
    }
    function onMouseLeave() {
      if (pointerType !== 'mouse') return
      if (downAt) finishUp()
    }

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length > 1) {
        reset()
        return
      }
      if (isOnMarker(e.target)) return
      e.preventDefault()
      const t = e.touches[0]
      beginDown(t.clientX, t.clientY, 'touch')
    }
    function onTouchMove(e: TouchEvent) {
      if (!downAt) return
      if (e.touches.length > 1) {
        reset()
        return
      }
      e.preventDefault()
      const t = e.touches[0]
      maybePromoteToStroke(t.clientX, t.clientY)
      if (isStroke) pushStrokePoint(t.clientX, t.clientY)
    }
    function onTouchEnd() {
      if (pointerType !== 'touch') return
      finishUp()
    }
    function onTouchCancel() {
      reset()
    }

    canvas.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('mouseleave', onMouseLeave)
    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd)
    canvas.addEventListener('touchcancel', onTouchCancel)

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('mouseleave', onMouseLeave)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
      canvas.removeEventListener('touchcancel', onTouchCancel)
      if (downAt) {
        map.dragPan.enable()
      }
    }
  }, [map, isDrawing, appendAnchor, startStroke, appendStrokePoint])

  function clearMarkers() {
    for (const marker of markersRef.current.values()) marker.remove()
    markersRef.current.clear()
  }

  return { clearMarkers }
}
