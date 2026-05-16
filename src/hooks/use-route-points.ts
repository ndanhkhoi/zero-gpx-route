import { useCallback, useMemo, useRef, useState } from 'react'
import type { AnchorSegment, DrawSegment, LatLng } from '../types/route'
import { createSegmentId, flattenSegments, getAnchors } from '../drawing/segments'

export interface UseRoutePointsResult {
  routePoints: LatLng[]
  anchors: AnchorSegment[]
  appendAnchor: (point: LatLng) => string
  startStroke: (point: LatLng) => string
  appendStrokePoint: (id: string, point: LatLng) => void
  moveAnchor: (id: string, point: LatLng) => void
  removeSegment: (id: string) => void
  popLastSegment: () => void
  resetSegments: () => void
  hasRoute: boolean
  hasSegments: boolean
}

export function useRoutePoints(): UseRoutePointsResult {
  const [segments, setSegmentsState] = useState<DrawSegment[]>([])
  const segmentsRef = useRef<DrawSegment[]>([])

  const commit = useCallback((next: DrawSegment[]) => {
    segmentsRef.current = next
    setSegmentsState(next)
  }, [])

  const appendAnchor = useCallback((point: LatLng) => {
    const id = createSegmentId()
    commit([...segmentsRef.current, { kind: 'anchor', id, point }])
    return id
  }, [commit])

  const startStroke = useCallback((point: LatLng) => {
    const id = createSegmentId()
    commit([...segmentsRef.current, { kind: 'stroke', id, points: [point] }])
    return id
  }, [commit])

  const appendStrokePoint = useCallback((id: string, point: LatLng) => {
    const next = segmentsRef.current.map((seg) => {
      if (seg.kind === 'stroke' && seg.id === id) {
        return { ...seg, points: [...seg.points, point] }
      }
      return seg
    })
    commit(next)
  }, [commit])

  const moveAnchor = useCallback((id: string, point: LatLng) => {
    const next = segmentsRef.current.map((seg) => {
      if (seg.kind === 'anchor' && seg.id === id) {
        return { ...seg, point }
      }
      return seg
    })
    commit(next)
  }, [commit])

  const removeSegment = useCallback((id: string) => {
    commit(segmentsRef.current.filter((seg) => seg.id !== id))
  }, [commit])

  const popLastSegment = useCallback(() => {
    const current = segmentsRef.current
    if (current.length === 0) return
    commit(current.slice(0, -1))
  }, [commit])

  const resetSegments = useCallback(() => {
    commit([])
  }, [commit])

  const routePoints = useMemo(() => flattenSegments(segments), [segments])
  const anchors = useMemo(() => getAnchors(segments), [segments])

  return {
    routePoints,
    anchors,
    appendAnchor,
    startStroke,
    appendStrokePoint,
    moveAnchor,
    removeSegment,
    popLastSegment,
    resetSegments,
    hasRoute: routePoints.length > 1,
    hasSegments: segments.length > 0,
  }
}
