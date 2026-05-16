import maplibregl from 'maplibre-gl'
import { useEffect, useRef } from 'react'
import { haversineDistance } from '../shared/geo'
import { buildDisplayCoords } from '../preview/loop-builder'
import { hideRouteLine, updateRouteLine } from '../map/route-layer'
import type { LatLng } from '../types/route'

const PREVIEW_COLORS = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6']

interface UsePreviewRendererArgs {
  map: maplibregl.Map | null
  routePoints: LatLng[]
  duplicateCount: number
  offsetMinMeters: number
  offsetMaxMeters: number
  onRouteInfo: (totalDistanceMeters: number) => void
  onDisplayCoordsChange: (coords: LatLng[][]) => void
}

export function usePreviewRenderer({
  map,
  routePoints,
  duplicateCount,
  offsetMinMeters,
  offsetMaxMeters,
  onRouteInfo,
  onDisplayCoordsChange,
}: UsePreviewRendererArgs) {
  const previewLayerIdsRef = useRef<string[]>([])
  const previewSourceIdsRef = useRef<string[]>([])
  const rafIdRef = useRef<number | null>(null)
  const needsRefreshRef = useRef(false)
  const onRouteInfoRef = useRef(onRouteInfo)
  const onDisplayCoordsChangeRef = useRef(onDisplayCoordsChange)

  useEffect(() => {
    onRouteInfoRef.current = onRouteInfo
    onDisplayCoordsChangeRef.current = onDisplayCoordsChange
  }, [onRouteInfo, onDisplayCoordsChange])

  function clearPreviewLayers(targetMap: maplibregl.Map) {
    previewLayerIdsRef.current.forEach((id) => {
      if (targetMap.getLayer(id)) targetMap.removeLayer(id)
    })
    previewSourceIdsRef.current.forEach((id) => {
      if (targetMap.getSource(id)) targetMap.removeSource(id)
    })
    previewLayerIdsRef.current = []
    previewSourceIdsRef.current = []
  }

  useEffect(() => {
    if (!map) return

    function doRefresh() {
      if (!map) return
      if (routePoints.length < 2) {
        clearPreviewLayers(map)
        updateRouteLine(map, routePoints)
        onRouteInfoRef.current(0)
        onDisplayCoordsChangeRef.current([])
        return
      }

      const displayCoords = buildDisplayCoords(routePoints, duplicateCount, offsetMinMeters, offsetMaxMeters)
      onDisplayCoordsChangeRef.current(displayCoords)

      let totalPreviewDistance = 0

      while (previewLayerIdsRef.current.length > displayCoords.length) {
        const layerId = previewLayerIdsRef.current.pop()
        const sourceId = previewSourceIdsRef.current.pop()
        if (layerId && map.getLayer(layerId)) map.removeLayer(layerId)
        if (sourceId && map.getSource(sourceId)) map.removeSource(sourceId)
      }

      for (let i = 0; i < displayCoords.length; i++) {
        const displayPoints = displayCoords[i]
        if (displayPoints.length >= 2) {
          for (let j = 1; j < displayPoints.length; j++) {
            totalPreviewDistance += haversineDistance(displayPoints[j - 1], displayPoints[j])
          }
        }

        const sourceId = `preview-source-${i}`
        const layerId = `preview-line-${i}`

        const data: GeoJSON.Feature = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: displayPoints.map((p) => [p.lng, p.lat]),
          },
          properties: {},
        }

        const existing = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined
        if (existing) {
          existing.setData(data)
        } else {
          map.addSource(sourceId, { type: 'geojson', data })
          map.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': PREVIEW_COLORS[i % PREVIEW_COLORS.length],
              'line-width': 5,
              'line-opacity': 0.7,
            },
          })
          previewSourceIdsRef.current.push(sourceId)
          previewLayerIdsRef.current.push(layerId)
        }
      }

      hideRouteLine(map)
      onRouteInfoRef.current(totalPreviewDistance)
    }

    function schedule() {
      if (rafIdRef.current !== null) {
        needsRefreshRef.current = true
        return
      }
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null
        doRefresh()
        if (needsRefreshRef.current) {
          needsRefreshRef.current = false
          rafIdRef.current = requestAnimationFrame(() => {
            rafIdRef.current = null
            doRefresh()
          })
        }
      })
    }

    schedule()

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
      needsRefreshRef.current = false
    }
  }, [map, routePoints, duplicateCount, offsetMinMeters, offsetMaxMeters])

  function clearAll() {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    needsRefreshRef.current = false
    if (map) {
      clearPreviewLayers(map)
      if (map.getLayer('route-line')) map.removeLayer('route-line')
      if (map.getSource('route')) map.removeSource('route')
    }
  }

  return { clearAll }
}
