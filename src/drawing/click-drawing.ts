import maplibregl from 'maplibre-gl'
import type { AppState } from '../state/app-state'
import type { LatLng } from '../types/route'
import { interpolatePoints } from './interpolation'

const INTERPOLATION_COUNT = 10

export function addClickPoint(map: maplibregl.Map, state: AppState, point: LatLng, onUpdated: () => void) {
  state.clickedPoints.push(point)

  if (state.clickedPoints.length > 1) {
    const lastPoint = state.clickedPoints[state.clickedPoints.length - 2]
    const interpolatedPoints = interpolatePoints(lastPoint, point, INTERPOLATION_COUNT)
    state.routePoints = [...state.routePoints, ...interpolatedPoints]
  } else {
    state.routePoints.push(point)
  }

  const markerEl = document.createElement('div')
  markerEl.className = 'route-marker'
  markerEl.innerHTML = '<div class="marker-dot"></div>'

  const marker = new maplibregl.Marker({
    element: markerEl,
    draggable: true,
  })
    .setLngLat([point.lng, point.lat])
    .addTo(map)

  marker.on('dragend', () => {
    const lngLat = marker.getLngLat()
    const markerIndex = state.markerElements.indexOf(marker)
    if (markerIndex !== -1) {
      state.clickedPoints[markerIndex] = { lat: lngLat.lat, lng: lngLat.lng }
      recalculateInterpolatedPoints(state)
      onUpdated()
    }
  })

  state.markerElements.push(marker)
  onUpdated()
}

export function recalculateInterpolatedPoints(state: AppState) {
  if (state.clickedPoints.length < 2) return

  let newRoutePoints: LatLng[] = [state.clickedPoints[0]]

  for (let i = 1; i < state.clickedPoints.length; i++) {
    const interpolated = interpolatePoints(state.clickedPoints[i - 1], state.clickedPoints[i], INTERPOLATION_COUNT)
    newRoutePoints = [...newRoutePoints, ...interpolated]
  }

  state.routePoints = newRoutePoints
}
