import type maplibregl from 'maplibre-gl'
import type { AppState } from '../state/app-state'
import type { LatLng } from '../types/route'
import { haversineDistance } from '../shared/geo'

const FREEHAND_MIN_DISTANCE = 3

export interface FreehandController {
  attachFreehandListeners: () => void
  detachFreehandListeners: () => void
}

interface FreehandArgs {
  map: maplibregl.Map
  state: AppState
  onPoint: (point: LatLng) => void
  onRouteChanged: () => void
}

export function createFreehandController({ map, state, onPoint, onRouteChanged }: FreehandArgs): FreehandController {
  function getMousePoint(e: MouseEvent): LatLng {
    const rect = map.getCanvas().getBoundingClientRect()
    const point = map.unproject([e.clientX - rect.left, e.clientY - rect.top])
    return { lat: point.lat, lng: point.lng }
  }

  function getTouchPoint(e: TouchEvent): LatLng {
    const touch = e.touches[0]
    const rect = map.getCanvas().getBoundingClientRect()
    const point = map.unproject([touch.clientX - rect.left, touch.clientY - rect.top])
    return { lat: point.lat, lng: point.lng }
  }

  function maybePushPoint(point: LatLng) {
    const lastPoint = state.routePoints[state.routePoints.length - 1]
    if (lastPoint && haversineDistance(lastPoint, point) >= FREEHAND_MIN_DISTANCE) {
      state.addRoutePoint(point)
      onRouteChanged()
    }
  }

  function onFreehandMouseDown(e: MouseEvent) {
    if (e.button !== 0) return
    state.startFreehand()
    map.dragPan.disable()
    onPoint(getMousePoint(e))
  }

  function onFreehandMouseMove(e: MouseEvent) {
    if (!state.isFreehandDown) return
    maybePushPoint(getMousePoint(e))
  }

  function onFreehandPointerEnd() {
    if (state.isFreehandDown) {
      state.stopFreehand()
      map.dragPan.enable()
    }
  }

  function onFreehandTouchStart(e: TouchEvent) {
    e.preventDefault()
    state.startFreehand()
    map.dragPan.disable()
    onPoint(getTouchPoint(e))
  }

  function onFreehandTouchMove(e: TouchEvent) {
    e.preventDefault()
    if (!state.isFreehandDown) return
    maybePushPoint(getTouchPoint(e))
  }

  function attachFreehandListeners() {
    const canvas = map.getCanvasContainer()
    canvas.addEventListener('mousedown', onFreehandMouseDown)
    canvas.addEventListener('mousemove', onFreehandMouseMove)
    canvas.addEventListener('mouseup', onFreehandPointerEnd)
    canvas.addEventListener('mouseleave', onFreehandPointerEnd)
    canvas.addEventListener('touchstart', onFreehandTouchStart, { passive: false })
    canvas.addEventListener('touchmove', onFreehandTouchMove, { passive: false })
    canvas.addEventListener('touchend', onFreehandPointerEnd)
    canvas.addEventListener('touchcancel', onFreehandPointerEnd)
  }

  function detachFreehandListeners() {
    const canvas = map.getCanvasContainer()
    canvas.removeEventListener('mousedown', onFreehandMouseDown)
    canvas.removeEventListener('mousemove', onFreehandMouseMove)
    canvas.removeEventListener('mouseup', onFreehandPointerEnd)
    canvas.removeEventListener('mouseleave', onFreehandPointerEnd)
    canvas.removeEventListener('touchstart', onFreehandTouchStart)
    canvas.removeEventListener('touchmove', onFreehandTouchMove)
    canvas.removeEventListener('touchend', onFreehandPointerEnd)
    canvas.removeEventListener('touchcancel', onFreehandPointerEnd)
    if (state.isFreehandDown) {
      state.stopFreehand()
      map.dragPan.enable()
    }
  }

  return { attachFreehandListeners, detachFreehandListeners }
}
