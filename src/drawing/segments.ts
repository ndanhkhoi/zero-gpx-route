import type { AnchorSegment, DrawSegment, LatLng } from '../types/route'
import { interpolatePoints } from './interpolation'

const INTERPOLATION_COUNT = 10
const SMOOTH_PASSES = 2

export function flattenSegments(segments: DrawSegment[]): LatLng[] {
  const out: LatLng[] = []
  let last: LatLng | null = null

  for (const seg of segments) {
    if (seg.kind === 'anchor') {
      if (last) {
        out.push(...interpolatePoints(last, seg.point, INTERPOLATION_COUNT))
      } else {
        out.push(seg.point)
      }
      last = seg.point
      continue
    }

    if (seg.points.length === 0) continue

    const stroke = seg.points.length >= 3
      ? chaikinSmooth(seg.points, SMOOTH_PASSES)
      : seg.points

    if (last) {
      out.push(...interpolatePoints(last, stroke[0], INTERPOLATION_COUNT))
      out.push(...stroke.slice(1))
    } else {
      out.push(...stroke)
    }
    last = stroke[stroke.length - 1]
  }

  return out
}

// Chaikin's corner-cutting: each pair (P_i, P_i+1) becomes (Q, R)
// at 25% / 75% along the segment. Endpoints are preserved.
function chaikinSmooth(points: LatLng[], passes: number): LatLng[] {
  if (points.length < 3 || passes <= 0) return points
  let current = points
  for (let p = 0; p < passes; p++) {
    const next: LatLng[] = [current[0]]
    for (let i = 0; i < current.length - 1; i++) {
      const a = current[i]
      const b = current[i + 1]
      next.push({
        lat: a.lat * 0.75 + b.lat * 0.25,
        lng: a.lng * 0.75 + b.lng * 0.25,
      })
      next.push({
        lat: a.lat * 0.25 + b.lat * 0.75,
        lng: a.lng * 0.25 + b.lng * 0.75,
      })
    }
    next.push(current[current.length - 1])
    current = next
  }
  return current
}

export function getAnchors(segments: DrawSegment[]): AnchorSegment[] {
  return segments.filter((s): s is AnchorSegment => s.kind === 'anchor')
}

export function createSegmentId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
