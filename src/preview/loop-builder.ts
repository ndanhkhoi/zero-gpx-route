import type { LatLng } from '../types/route'
import { createRng } from '../shared/random'

const TRANSITION_POINTS = 8
// Low-pass smoothing factor for the per-point offset noise.
// Closer to 1 = smoother arc; closer to 0 = more jitter.
const OFFSET_SMOOTHING = 0.92

function buildTransitionPoints(fromPoint: LatLng, toPoint: LatLng): LatLng[] {
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

    // Smoothed random walk in meters (per axis) so adjacent points share noise.
    let latOffsetMeters = signedRandom(rng) * offsetMaxMeters
    let lngOffsetMeters = signedRandom(rng) * offsetMaxMeters

    routePoints.forEach((point) => {
      const targetMagnitude = offsetMinMeters + rng() * (offsetMaxMeters - offsetMinMeters)
      const targetLat = signedRandom(rng) * targetMagnitude
      const targetLng = signedRandom(rng) * targetMagnitude

      latOffsetMeters = latOffsetMeters * OFFSET_SMOOTHING + targetLat * (1 - OFFSET_SMOOTHING)
      lngOffsetMeters = lngOffsetMeters * OFFSET_SMOOTHING + targetLng * (1 - OFFSET_SMOOTHING)

      offsetPoints.push({
        lat: point.lat + latOffsetMeters * metersToDegreesLat,
        lng: point.lng + lngOffsetMeters * metersToDegreesLng,
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

function signedRandom(rng: () => number): number {
  return rng() * 2 - 1
}
