import maplibregl from 'maplibre-gl'
import './styles.css'
import { getDomElements } from './dom/elements'
import { addClickPoint } from './drawing/click-drawing'
import { createFreehandController } from './drawing/freehand-drawing'
import { exportRouteAsGpx } from './export/export-controller'
import { createMapInstance } from './map/map-instance'
import { createGeocoderControl } from './map/geocoder-ui'
import { createPreviewRenderer } from './preview/preview-renderer'
import { createAppState } from './state/app-state'
import { getDefaultStartTimeValue, parseStartTimeInput } from './shared/time'
import type { DrawMode, LatLng, RouteType } from './types/route'
import { showAlert, showConfirm } from './ui/modal'
import { updateButtonStates, updateRouteInfo } from './ui/status'

const PRESETS: Record<RouteType, { paceMinPerKm: number; offsetMinMeters: number; offsetMaxMeters: number; elevation: number }> = {
  run: { paceMinPerKm: 5.5, offsetMinMeters: 0.05, offsetMaxMeters: 0.2, elevation: 10 },
  walk: { paceMinPerKm: 12, offsetMinMeters: 0.1, offsetMaxMeters: 0.5, elevation: 5 },
}

const state = createAppState()
const dom = getDomElements()
const map = createMapInstance()
createGeocoderControl(map, 'geocoder')

dom.startTimeInput.value = getDefaultStartTimeValue()

function readPaceMinPerKm(): number {
  return parseFloat(dom.speedInput.value) || 9.6
}

function readDuplicateCount(): number {
  return parseInt(dom.duplicateCountInput.value) || 1
}

function readOffsetMinMeters(): number {
  return parseFloat(dom.minOffsetInput.value) || 0.05
}

function readOffsetMaxMeters(): number {
  return parseFloat(dom.maxOffsetInput.value) || 0.2
}

function readElevation(): number {
  return parseFloat(dom.elevationInput.value) || 10
}

function getHasRoute() {
  return state.hasRoute()
}

function syncButtonStates() {
  updateButtonStates({
    isDrawing: state.isDrawing,
    hasRoute: getHasRoute(),
    exportBtn: dom.exportGpxBtn,
    drawStatusEl: dom.drawStatusEl,
    drawModeBtns: dom.drawModeBtns,
    routeTypeBtns: dom.routeTypeBtns,
    settingsInputs,
  })
}

const previewRenderer = createPreviewRenderer({
  map,
  state,
  getOptions: () => ({
    duplicateCount: readDuplicateCount(),
    offsetMinMeters: readOffsetMinMeters(),
    offsetMaxMeters: readOffsetMaxMeters(),
    paceMinPerKm: readPaceMinPerKm(),
  }),
  onRouteInfo: (totalPreviewDistance, paceMinPerKm) => {
    updateRouteInfo(totalPreviewDistance, paceMinPerKm, dom.totalDistanceEl, dom.totalTimeEl)
  },
})

function onRouteChanged() {
  previewRenderer.refreshPreview()
  syncButtonStates()
}

const freehand = createFreehandController({
  map,
  state,
  onPoint: (point) => {
    state.addClickedPoint(point)
    state.addRoutePoint(point)
    onRouteChanged()
  },
  onRouteChanged,
})

function clampValue(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function setSliderValue(input: HTMLInputElement, valueEl: HTMLInputElement, value: string) {
  input.value = value
  valueEl.value = value
}

function applyPreset(type: RouteType) {
  const preset = PRESETS[type]
  setSliderValue(dom.speedInput, dom.speedValueEl, String(preset.paceMinPerKm))
  setSliderValue(dom.minOffsetInput, dom.minOffsetValueEl, String(preset.offsetMinMeters))
  setSliderValue(dom.maxOffsetInput, dom.maxOffsetValueEl, String(preset.offsetMaxMeters))
  setSliderValue(dom.elevationInput, dom.elevationValueEl, String(preset.elevation))
  previewRenderer.refreshPreview()
}

function setRouteType(type: RouteType) {
  state.routeType = type
  dom.routeTypeBtns.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.value === type)
  })
  applyPreset(type)
}

function setDrawMode(mode: DrawMode) {
  state.drawMode = mode
  dom.drawModeBtns.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.mode === mode)
  })
  if (state.isDrawing) stopDrawing()
}

function onMapClick(e: maplibregl.MapMouseEvent) {
  addRoutePoint({ lat: e.lngLat.lat, lng: e.lngLat.lng })
}

function addRoutePoint(point: LatLng) {
  if (state.drawMode === 'click') {
    addClickPoint(map, state, point, onRouteChanged)
    return
  }

  state.clickedPoints.push(point)
  state.routePoints.push(point)
  onRouteChanged()
}

function startDrawing() {
  state.isDrawing = true
  dom.addPointBtn.innerHTML = '<i class="fas fa-stop"></i> <span class="btn-label">Dừng vẽ</span>'
  dom.addPointBtn.classList.add('active')
  map.getCanvas().style.cursor = 'crosshair'

  if (state.drawMode === 'click') {
    map.on('click', onMapClick)
  } else {
    freehand.attachFreehandListeners()
  }

  syncButtonStates()
}

function stopDrawing() {
  state.isDrawing = false
  state.isFreehandDown = false
  dom.addPointBtn.innerHTML = '<i class="fas fa-play"></i> <span class="btn-label">Bắt đầu vẽ</span>'
  dom.addPointBtn.classList.remove('active')
  map.getCanvas().style.cursor = ''

  if (state.drawMode === 'click') {
    map.off('click', onMapClick)
  } else {
    freehand.detachFreehandListeners()
  }

  syncButtonStates()
}

function resetApp() {
  if (state.isDrawing) stopDrawing()

  previewRenderer.cancelPendingRefresh()

  state.markerElements.forEach((marker) => marker.remove())
  state.markerElements.length = 0

  if (map.getLayer('route-line')) map.removeLayer('route-line')
  if (map.getSource('route')) map.removeSource('route')

  previewRenderer.clearPreviewLayers()

  state.routePoints = []
  state.clickedPoints.length = 0
  state.preview.displayCoords = null

  setSliderValue(dom.speedInput, dom.speedValueEl, '9.6')
  setSliderValue(dom.duplicateCountInput, dom.duplicateCountValueEl, '1')
  setSliderValue(dom.minOffsetInput, dom.minOffsetValueEl, '0.05')
  setSliderValue(dom.maxOffsetInput, dom.maxOffsetValueEl, '0.2')
  setSliderValue(dom.elevationInput, dom.elevationValueEl, '10')
  setRouteType('run')

  dom.startTimeInput.value = getDefaultStartTimeValue()

  dom.totalDistanceEl.textContent = '0 km'
  dom.totalTimeEl.textContent = '0 phút'

  syncButtonStates()
}

const sliderPairs: [HTMLInputElement, HTMLInputElement][] = [
  [dom.speedInput, dom.speedValueEl],
  [dom.duplicateCountInput, dom.duplicateCountValueEl],
  [dom.minOffsetInput, dom.minOffsetValueEl],
  [dom.maxOffsetInput, dom.maxOffsetValueEl],
  [dom.elevationInput, dom.elevationValueEl],
]

sliderPairs.forEach(([slider, valueInput]) => {
  slider.addEventListener('input', () => {
    valueInput.value = slider.value
    previewRenderer.refreshPreview()
  })

  valueInput.addEventListener('input', () => {
    const min = parseFloat(slider.min)
    const max = parseFloat(slider.max)
    const num = parseFloat(valueInput.value)
    if (isNaN(num)) return
    const clamped = clampValue(num, min, max)
    slider.value = String(clamped)
    previewRenderer.refreshPreview()
  })

  valueInput.addEventListener('change', () => {
    const min = parseFloat(slider.min)
    const max = parseFloat(slider.max)
    const num = parseFloat(valueInput.value)
    const clamped = clampValue(isNaN(num) ? min : num, min, max)
    valueInput.value = String(clamped)
    slider.value = String(clamped)
    previewRenderer.refreshPreview()
  })
})

dom.startTimeInput.addEventListener('input', () => previewRenderer.refreshPreview())

const settingsInputs: HTMLInputElement[] = [
  ...sliderPairs.map(([input]) => input),
  dom.startTimeInput,
]

dom.routeTypeBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    if (state.isDrawing) return
    const value = btn.dataset.value as RouteType | undefined
    if (!value) return
    setRouteType(value)
  })
})

dom.drawModeBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    if (state.isDrawing) return
    const mode = btn.dataset.mode as DrawMode | undefined
    if (!mode) return
    setDrawMode(mode)
  })
})

dom.addPointBtn.addEventListener('click', () => {
  if (state.isDrawing) {
    stopDrawing()
  } else if (getHasRoute()) {
    showConfirm('Bạn có muốn vẽ lại từ đầu? Dữ liệu hiện tại sẽ bị xóa.', (confirmed) => {
      if (confirmed) {
        resetApp()
        startDrawing()
      }
    })
  } else {
    startDrawing()
  }
})

dom.resetAppBtn.addEventListener('click', () => {
  showConfirm('Bạn có chắc chắn muốn làm lại từ đầu?', (confirmed) => {
    if (confirmed) resetApp()
  })
})

dom.exportGpxBtn.addEventListener('click', () => {
  const allRoutePoints = previewRenderer.getDisplayCoords().flat()
  exportRouteAsGpx({
    points: allRoutePoints,
    paceMinPerKm: readPaceMinPerKm(),
    elevation: readElevation(),
    startTime: parseStartTimeInput(dom.startTimeInput.value),
    routeType: state.routeType,
    onError: showAlert,
    onSuccess: showAlert,
  })
})

syncButtonStates()
