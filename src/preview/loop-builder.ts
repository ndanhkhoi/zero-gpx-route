import type { LatLng } from '../types/route'
import { createRng } from '../shared/random'

const TRANSITION_POINTS = 8

export function buildTransitionPoints(fromPoint: LatLng, toPoint: LatLng): LatLng[] {
  const midLat = (fromPoint.lat + toPoint.lat) / 2
  const midLng = (fromPoint.lng + toPoint.lng) / 2

  const dx = toPoint.lng - fromPoint.lng
  const dy = toPoint.lat - fromPoint.lat
  const dist = Math.sqrt(dx * dx + dy * dy)
  const perpScale = dist * 0.15
  const arcLat = midLat + (-dx / (dist || 1)) * perpScale
  const arcLng = midLng + (dy / (dist || 1)) * perpScale

  const result: LatLng[] = []

  for (let i = 1; i <= TRANSITION_POINTS; i++) {
    const t = i / TRANSITION_POINTS
    const lat = (1 - t) ** 2 * fromPoint.lat + 2 * (1 - t) * t * arcLat + t ** 2 * toPoint.lat
    const lng = (1 - t) ** 2 * fromPoint.lng + 2 * (1 - t) * t * arcLng + t ** 2 * toPoint.lng
    result.push({ lat, lng })
  }

  return result
}

export function buildDisplayCoords(
  routePoints: LatLng[],
  duplicateCount: number,
  offsetMinMeters: number,
  offsetMaxMeters: number,
): LatLng[][] {
  const avgLat = routePoints.reduce((sum, p) => sum + p.lat, 0) / routePoints.length
  const metersToDegreesLat = 1 / 111320
  const metersToDegreesLng = 1 / (111320 * Math.cos(avgLat * Math.PI / 180))

  const allLoopPoints: LatLng[][] = []

  for (let i = 0; i < duplicateCount; i++) {
    const rng = createRng(42 + i * 1000)
    const offsetPoints: LatLng[] = []

    routePoints.forEach((point) => {
      const randomOffset = offsetMinMeters + rng() * (offsetMaxMeters - offsetMinMeters)
      const latDirection = rng() > 0.5 ? 1 : -1
      const lngDirection = rng() > 0.5 ? 1 : -1

      offsetPoints.push({
        lat: point.lat + latDirection * randomOffset * metersToDegreesLat,
        lng: point.lng + lngDirection * randomOffset * metersToDegreesLng,
        routeIndex: i,
      })
    })

    allLoopPoints.push(offsetPoints)
  }

  const displayCoords: LatLng[][] = []
  for (let i = 0; i < duplicateCount; i++) {
    const points = [...allLoopPoints[i]]

    if (i < duplicateCount - 1 && points.length > 0 && allLoopPoints[i + 1].length > 0) {
      points.push(...buildTransitionPoints(points[points.length - 1], allLoopPoints[i + 1][0]))
    }

    displayCoords.push(points)
  }

  return displayCoords
}
