import type maplibregl from 'maplibre-gl'
import type { AppState } from '../state/app-state'
import type { LatLng } from '../types/route'
import { haversineDistance } from '../shared/geo'
import { updateRouteLine, hideRouteLine } from '../map/route-layer'
import { buildDisplayCoords } from './loop-builder'

const PREVIEW_COLORS = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6']

interface PreviewOptions {
  duplicateCount: number
  offsetMinMeters: number
  offsetMaxMeters: number
  paceMinPerKm: number
}

interface PreviewRendererArgs {
  map: maplibregl.Map
  state: AppState
  getOptions: () => PreviewOptions
  onRouteInfo: (totalPreviewDistance: number, paceMinPerKm: number) => void
}

export interface PreviewRenderer {
  clearPreviewLayers: () => void
  cancelPendingRefresh: () => void
  invalidatePreviewCache: () => void
  getDisplayCoords: () => LatLng[][]
  refreshPreview: () => void
}

export function createPreviewRenderer({ map, state, getOptions, onRouteInfo }: PreviewRendererArgs): PreviewRenderer {
  function clearPreviewLayers() {
    state.previewLayerIds.forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id)
    })
    state.previewSourceIds.forEach((id) => {
      if (map.getSource(id)) map.removeSource(id)
    })
    state.previewLayerIds = []
    state.previewSourceIds = []
  }

  function invalidatePreviewCache() {
    state.preview.displayCoords = null
  }

  function getDisplayCoords(): LatLng[][] {
    if (state.preview.displayCoords) return state.preview.displayCoords

    const { duplicateCount, offsetMinMeters, offsetMaxMeters } = getOptions()
    state.preview.displayCoords = buildDisplayCoords(
      state.routePoints,
      duplicateCount,
      offsetMinMeters,
      offsetMaxMeters,
    )

    return state.preview.displayCoords
  }

  function doRefreshPreview() {
    if (state.routePoints.length < 2) {
      clearPreviewLayers()
      updateRouteLine(map, state.routePoints)
      onRouteInfo(0, getOptions().paceMinPerKm)
      return
    }

    invalidatePreviewCache()
    const displayCoords = getDisplayCoords()
    const duplicateCount = displayCoords.length

    let totalPreviewDistance = 0

    while (state.previewLayerIds.length > duplicateCount) {
      const layerId = state.previewLayerIds.pop()
      const sourceId = state.previewSourceIds.pop()
      if (layerId && map.getLayer(layerId)) map.removeLayer(layerId)
      if (sourceId && map.getSource(sourceId)) map.removeSource(sourceId)
    }

    for (let i = 0; i < duplicateCount; i++) {
      const displayPoints = displayCoords[i]

      if (displayPoints.length >= 2) {
        for (let j = 1; j < displayPoints.length; j++) {
          totalPreviewDistance += haversineDistance(displayPoints[j - 1], displayPoints[j])
        }
      }

      const sourceId = `preview-source-${i}`
      const layerId = `preview-line-${i}`

      if (map.getSource(sourceId)) {
        const source = map.getSource(sourceId) as maplibregl.GeoJSONSource
        source.setData({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: displayPoints.map((p) => [p.lng, p.lat]),
          },
          properties: {},
        })
      } else {
        map.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: displayPoints.map((p) => [p.lng, p.lat]),
            },
            properties: {},
          },
        })

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

        state.previewSourceIds.push(sourceId)
        state.previewLayerIds.push(layerId)
      }
    }

    hideRouteLine(map)
    onRouteInfo(totalPreviewDistance, getOptions().paceMinPerKm)
  }

  function refreshPreview() {
    if (state.preview.rafId !== null) {
      state.preview.needsRefresh = true
      return
    }

    state.preview.rafId = requestAnimationFrame(() => {
      state.preview.rafId = null
      doRefreshPreview()
      if (state.preview.needsRefresh) {
        state.preview.needsRefresh = false
        state.preview.rafId = requestAnimationFrame(() => {
          state.preview.rafId = null
          doRefreshPreview()
        })
      }
    })
  }

  function cancelPendingRefresh() {
    if (state.preview.rafId !== null) {
      cancelAnimationFrame(state.preview.rafId)
      state.preview.rafId = null
    }
    state.preview.needsRefresh = false
  }

  return { clearPreviewLayers, cancelPendingRefresh, invalidatePreviewCache, getDisplayCoords, refreshPreview }
}
