import type { LatLng } from '../types/route'

export function interpolatePoints(point1: LatLng, point2: LatLng, numPoints: number): LatLng[] {
  const result: LatLng[] = []

  for (let i = 1; i <= numPoints; i++) {
    const ratio = i / (numPoints + 1)
    result.push({
      lat: point1.lat + (point2.lat - point1.lat) * ratio,
      lng: point1.lng + (point2.lng - point1.lng) * ratio,
    })
  }

  result.push(point2)
  return result
}
