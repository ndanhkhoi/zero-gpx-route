import type maplibregl from 'maplibre-gl'
import type { DrawMode, LatLng, RouteType } from '../types/route'

export interface PreviewCacheState {
  displayCoords: LatLng[][] | null
  rafId: number | null
  needsRefresh: boolean
}

export interface AppState {
  isDrawing: boolean
  isFreehandDown: boolean
  drawMode: DrawMode
  routeType: RouteType
  routePoints: LatLng[]
  clickedPoints: LatLng[]
  markerElements: maplibregl.Marker[]
  previewLayerIds: string[]
  previewSourceIds: string[]
  preview: PreviewCacheState

  hasRoute: () => boolean
  setDrawing: (isDrawing: boolean) => void
  startFreehand: () => void
  stopFreehand: () => void
  addRoutePoint: (point: LatLng) => void
  addClickedPoint: (point: LatLng) => void
}

export function createAppState(): AppState {
  const state: AppState = {
    isDrawing: false,
    isFreehandDown: false,
    drawMode: 'freehand',
    routeType: 'run',
    routePoints: [],
    clickedPoints: [],
    markerElements: [],
    previewLayerIds: [],
    previewSourceIds: [],
    preview: {
      displayCoords: null,
      rafId: null,
      needsRefresh: false,
    },
    hasRoute() {
      return this.routePoints.length > 1
    },
    setDrawing(isDrawing) {
      this.isDrawing = isDrawing
    },
    startFreehand() {
      this.isFreehandDown = true
    },
    stopFreehand() {
      this.isFreehandDown = false
    },
    addRoutePoint(point) {
      this.routePoints.push(point)
    },
    addClickedPoint(point) {
      this.clickedPoints.push(point)
    },
  }

  return state
}
