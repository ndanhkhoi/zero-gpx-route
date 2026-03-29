import maplibregl from 'maplibre-gl'
import { toZonedTime } from 'date-fns-tz'
import { format, addSeconds, addMilliseconds, getHours, parseISO } from 'date-fns'
import './styles.css'

const TIMEZONE = 'Asia/Ho_Chi_Minh'

interface LatLng {
  lat: number
  lng: number
  routeIndex?: number
}

// Haversine distance between two lat/lng points in meters
function haversineDistance(p1: LatLng, p2: LatLng): number {
  const R = 6371000
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// --- Map setup ---
const map = new maplibregl.Map({
  container: 'map',
  style: `https://tiles.openfreemap.org/styles/liberty`,
  center: [106.40129754087178, 10.354175408990718],
  zoom: 16,
})

map.addControl(new maplibregl.NavigationControl({ showCompass: false, showZoom: true }), 'top-right')

// --- State ---
let isDrawing = false
let drawMode: 'click' | 'freehand' = 'freehand'
let isFreehandDown = false
let routePoints: LatLng[] = []
let previewLayerIds: string[] = []
let previewSourceIds: string[] = []

// Seeded PRNG for stable random offsets
function createRng(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

const markerElements: maplibregl.Marker[] = []
const userClickedPoints: LatLng[] = []

// --- DOM elements ---
const addPointBtn = document.getElementById('add-point') as HTMLButtonElement
const resetAppBtn = document.getElementById('reset-app') as HTMLButtonElement
const exportGpxBtn = document.getElementById('export-gpx') as HTMLButtonElement
const speedInput = document.getElementById('speed') as HTMLInputElement
const startTimeInput = document.getElementById('start-time') as HTMLInputElement
const totalDistanceEl = document.getElementById('total-distance')!
const totalTimeEl = document.getElementById('total-time')!
const routeTypeGroup = document.getElementById('route-type-group')!
const routeTypeBtns = routeTypeGroup.querySelectorAll('.route-type-btn') as NodeListOf<HTMLButtonElement>
let currentRouteType = 'run'

const PRESETS: Record<string, { pace: number; offsetMin: number; offsetMax: number; elevation: number }> = {
  run:  { pace: 5.5,  offsetMin: 0.05, offsetMax: 0.2, elevation: 10 },
  walk: { pace: 12,   offsetMin: 0.1,  offsetMax: 0.5, elevation: 5 },
}

function applyPreset(type: string) {
  const p = PRESETS[type]
  if (!p) return
  speedInput.value = String(p.pace)
  minOffsetInput.value = String(p.offsetMin)
  maxOffsetInput.value = String(p.offsetMax)
  elevationInput.value = String(p.elevation)
  refreshPreview()
}

function setRouteType(type: string) {
  currentRouteType = type
  routeTypeBtns.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.value === type)
  })
  applyPreset(type)
}

routeTypeBtns.forEach((btn) => {
  btn.addEventListener('click', () => setRouteType(btn.dataset.value!))
})
const duplicateCountInput = document.getElementById('duplicate-count') as HTMLInputElement
const minOffsetInput = document.getElementById('min-offset') as HTMLInputElement
const maxOffsetInput = document.getElementById('max-offset') as HTMLInputElement
const elevationInput = document.getElementById('elevation') as HTMLInputElement
const drawStatusEl = document.getElementById('draw-status')!

// --- Modal helpers ---
function dismissOverlay(overlay: HTMLDivElement) {
  overlay.classList.remove('open')
  overlay.addEventListener('transitionend', () => overlay.remove(), { once: true })
}

function showAlert(message: string) {
  const overlay = createModalOverlay()
  const modal = createModal('Thông báo', message, [
    { text: 'OK', primary: true, action: () => dismissOverlay(overlay) },
  ])
  overlay.appendChild(modal)
  document.body.appendChild(overlay)
}

function showConfirm(message: string, callback: (confirmed: boolean) => void) {
  const overlay = createModalOverlay()
  const modal = createModal('Xác nhận', message, [
    { text: 'Hủy', primary: false, action: () => { dismissOverlay(overlay); callback(false) } },
    { text: 'Đồng ý', primary: true, action: () => { dismissOverlay(overlay); callback(true) } },
  ])
  overlay.appendChild(modal)
  document.body.appendChild(overlay)
}

function createModalOverlay(): HTMLDivElement {
  const el = document.createElement('div')
  el.className = 'dark-modal-overlay'
  el.addEventListener('click', (e) => {
    if (e.target === el) {
      el.classList.remove('open')
      el.addEventListener('transitionend', () => el.remove(), { once: true })
    }
  })
  requestAnimationFrame(() => el.classList.add('open'))
  return el
}

function createModal(title: string, body: string, buttons: { text: string; primary: boolean; action: () => void }[]): HTMLDivElement {
  const modal = document.createElement('div')
  modal.className = 'dark-modal'

  const header = document.createElement('div')
  header.className = 'dark-modal-header'
  header.innerHTML = `<h3 class="text-lg font-semibold">${title}</h3>`
  modal.appendChild(header)

  const bodyEl = document.createElement('div')
  bodyEl.className = 'dark-modal-body'
  bodyEl.textContent = body
  modal.appendChild(bodyEl)

  const footer = document.createElement('div')
  footer.className = 'dark-modal-footer'
  buttons.forEach((btn) => {
    const button = document.createElement('button')
    button.textContent = btn.text
    button.className = btn.primary
      ? 'px-4 py-2 rounded-lg font-semibold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors cursor-pointer'
      : 'px-4 py-2 rounded-lg font-semibold border border-[var(--color-border)] text-[var(--color-slate-400)] hover:text-white hover:border-[var(--color-danger)] transition-colors cursor-pointer'
    button.addEventListener('click', btn.action)
    footer.appendChild(button)
  })
  modal.appendChild(footer)

  return modal
}

// --- Set default start time ---
const now = new Date()
startTimeInput.value = format(toZonedTime(now, TIMEZONE), "yyyy-MM-dd'T'HH:mm")

// --- Button states ---
function updateButtonStates() {
  const hasPoints = routePoints.length > 1

  if (isDrawing) {
    exportGpxBtn.disabled = true
  } else {
    exportGpxBtn.disabled = !hasPoints
  }

  drawStatusEl.textContent = isDrawing
    ? 'Đang vẽ điểm'
    : hasPoints
      ? 'Sẵn sàng xuất GPX'
      : 'Sẵn sàng'
  drawStatusEl.classList.toggle('is-drawing', isDrawing)
}

// --- Drawing ---
const drawModeGroup = document.getElementById('draw-mode-group')!
const drawModeBtns = drawModeGroup.querySelectorAll('.draw-mode-btn') as NodeListOf<HTMLButtonElement>

function setDrawMode(mode: 'click' | 'freehand') {
  drawMode = mode
  drawModeBtns.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.mode === mode)
  })
  // If currently drawing, stop and restart with new mode
  if (isDrawing) stopDrawing()
}

drawModeBtns.forEach((btn) => {
  btn.addEventListener('click', () => setDrawMode(btn.dataset.mode as 'click' | 'freehand'))
})

addPointBtn.addEventListener('click', () => {
  if (isDrawing) {
    stopDrawing()
  } else {
    startDrawing()
  }
})

function startDrawing() {
  isDrawing = true
  addPointBtn.innerHTML = '<i class="fas fa-stop"></i> Dừng vẽ'
  addPointBtn.classList.add('active')
  map.getCanvas().style.cursor = 'crosshair'

  if (drawMode === 'click') {
    map.on('click', onMapClick)
  } else {
    const canvas = map.getCanvasContainer()
    canvas.addEventListener('mousedown', onFreehandMouseDown)
    canvas.addEventListener('mousemove', onFreehandMouseMove)
    canvas.addEventListener('mouseup', onFreehandMouseUp)
    canvas.addEventListener('mouseleave', onFreehandMouseUp)
    // Touch support
    canvas.addEventListener('touchstart', onFreehandTouchStart, { passive: false })
    canvas.addEventListener('touchmove', onFreehandTouchMove, { passive: false })
    canvas.addEventListener('touchend', onFreehandMouseUp)
  }

  updateButtonStates()
}

function stopDrawing() {
  isDrawing = false
  isFreehandDown = false
  addPointBtn.innerHTML = '<i class="fas fa-draw-polygon"></i> Bắt đầu vẽ'
  addPointBtn.classList.remove('active')
  map.getCanvas().style.cursor = ''

  if (drawMode === 'click') {
    map.off('click', onMapClick)
  } else {
    const canvas = map.getCanvasContainer()
    canvas.removeEventListener('mousedown', onFreehandMouseDown)
    canvas.removeEventListener('mousemove', onFreehandMouseMove)
    canvas.removeEventListener('mouseup', onFreehandMouseUp)
    canvas.removeEventListener('mouseleave', onFreehandMouseUp)
    canvas.removeEventListener('touchstart', onFreehandTouchStart)
    canvas.removeEventListener('touchmove', onFreehandTouchMove)
    canvas.removeEventListener('touchend', onFreehandMouseUp)
  }

  updateButtonStates()
}

function onMapClick(e: maplibregl.MapMouseEvent) {
  addRoutePoint({ lat: e.lngLat.lat, lng: e.lngLat.lng })
}

// --- Freehand drawing ---
const FREEHAND_MIN_DISTANCE = 3 // meters between freehand points

function onFreehandMouseDown(e: MouseEvent) {
  if (e.button !== 0) return
  isFreehandDown = true
  map.dragPan.disable()
  const point = getFreehandPoint(e)
  addRoutePoint(point)
}

function onFreehandMouseMove(e: MouseEvent) {
  if (!isFreehandDown) return
  const point = getFreehandPoint(e)
  const lastPoint = routePoints[routePoints.length - 1]
  if (lastPoint && haversineDistance(lastPoint, point) >= FREEHAND_MIN_DISTANCE) {
    routePoints.push(point)
    refreshPreview()
  }
}

function onFreehandMouseUp() {
  if (isFreehandDown) {
    isFreehandDown = false
    map.dragPan.enable()
  }
}

function onFreehandTouchStart(e: TouchEvent) {
  e.preventDefault()
  isFreehandDown = true
  const point = getFreehandTouchPoint(e)
  addRoutePoint(point)
}

function onFreehandTouchMove(e: TouchEvent) {
  e.preventDefault()
  if (!isFreehandDown) return
  const point = getFreehandTouchPoint(e)
  const lastPoint = routePoints[routePoints.length - 1]
  if (lastPoint && haversineDistance(lastPoint, point) >= FREEHAND_MIN_DISTANCE) {
    routePoints.push(point)
    refreshPreview()
  }
}

function getFreehandPoint(e: MouseEvent): LatLng {
  const rect = map.getCanvas().getBoundingClientRect()
  const point = map.unproject([e.clientX - rect.left, e.clientY - rect.top])
  return { lat: point.lat, lng: point.lng }
}

function getFreehandTouchPoint(e: TouchEvent): LatLng {
  const touch = e.touches[0]
  const rect = map.getCanvas().getBoundingClientRect()
  const point = map.unproject([touch.clientX - rect.left, touch.clientY - rect.top])
  return { lat: point.lat, lng: point.lng }
}

function addRoutePoint(point: LatLng) {
  userClickedPoints.push(point)

  if (drawMode === 'click' && userClickedPoints.length > 1) {
    const lastPoint = userClickedPoints[userClickedPoints.length - 2]
    const interpolatedPoints = interpolatePoints(lastPoint, point, 10)
    routePoints = [...routePoints, ...interpolatedPoints]
  } else {
    routePoints.push(point)
  }

  // Add marker only in click mode
  if (drawMode === 'click') {
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
      const markerIndex = markerElements.indexOf(marker)
      if (markerIndex !== -1) {
        userClickedPoints[markerIndex] = { lat: lngLat.lat, lng: lngLat.lng }
        recalculateInterpolatedPoints()
        refreshPreview()
      }
    })

    markerElements.push(marker)
  }

  refreshPreview()
  updateButtonStates()
}

function recalculateInterpolatedPoints() {
  if (userClickedPoints.length < 2) return

  let newRoutePoints: LatLng[] = [userClickedPoints[0]]

  for (let i = 1; i < userClickedPoints.length; i++) {
    const interpolated = interpolatePoints(userClickedPoints[i - 1], userClickedPoints[i], 10)
    newRoutePoints = [...newRoutePoints, ...interpolated]
  }

  routePoints = newRoutePoints
}

function interpolatePoints(point1: LatLng, point2: LatLng, numPoints: number): LatLng[] {
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

// --- Generate transition points between loops ---
const TRANSITION_POINTS = 8

function generateTransitionPoints(
  fromPoint: LatLng,
  toPoint: LatLng,
): LatLng[] {
  // Create a slight arc midpoint offset perpendicular to the line
  const midLat = (fromPoint.lat + toPoint.lat) / 2
  const midLng = (fromPoint.lng + toPoint.lng) / 2

  // Perpendicular offset for a natural curve
  const dx = toPoint.lng - fromPoint.lng
  const dy = toPoint.lat - fromPoint.lat
  const dist = Math.sqrt(dx * dx + dy * dy)
  const perpScale = dist * 0.15
  const arcLat = midLat + (-dx / (dist || 1)) * perpScale
  const arcLng = midLng + (dy / (dist || 1)) * perpScale

  const result: LatLng[] = []

  for (let i = 1; i <= TRANSITION_POINTS; i++) {
    const t = i / TRANSITION_POINTS
    // Quadratic bezier: (1-t)^2 * P0 + 2*(1-t)*t * Control + t^2 * P1
    const lat = (1 - t) ** 2 * fromPoint.lat + 2 * (1 - t) * t * arcLat + t ** 2 * toPoint.lat
    const lng = (1 - t) ** 2 * fromPoint.lng + 2 * (1 - t) * t * arcLng + t ** 2 * toPoint.lng
    result.push({ lat, lng })
  }

  return result
}

// --- Route line (GeoJSON layer) ---
function updateRouteLine() {
  if (!map.getSource('route')) {
    map.addSource('route', {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} },
    })
    map.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': '#3498db',
        'line-width': 5,
        'line-opacity': 0.7,
      },
    })
  }

  if (routePoints.length >= 2) {
    const source = map.getSource('route') as maplibregl.GeoJSONSource
    source.setData({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: routePoints.map((p) => [p.lng, p.lat]),
      },
      properties: {},
    })
  }
}

// --- Route info ---
function updateRouteInfo(totalPreviewDistance: number = 0) {
  const distanceKm = (totalPreviewDistance / 1000).toFixed(2)
  totalDistanceEl.textContent = `${distanceKm} km`

  const paceMinKm = parseFloat(speedInput.value) || 9.6
  const totalMinutes = parseFloat(distanceKm) * paceMinKm
  const hours = Math.floor(totalMinutes / 60)
  const minutes = Math.floor(totalMinutes % 60)

  totalTimeEl.textContent =
    hours > 0 ? `${hours}g ${minutes}p` : `${minutes}p`
}

// --- Build loops with transitions (cached, built once by preview) ---
let cachedDisplayCoords: LatLng[][] | null = null

function getDisplayCoords(): LatLng[][] {
  if (cachedDisplayCoords) return cachedDisplayCoords

  const duplicateCount = parseInt(duplicateCountInput.value) || 1
  const minOffsetMeters = parseFloat(minOffsetInput.value) || 0.05
  const maxOffsetMeters = parseFloat(maxOffsetInput.value) || 0.2
  const metersToDegreesLat = 0.000009
  const metersToDegreesLng = 0.000011

  const allLoopPoints: LatLng[][] = []

  for (let i = 0; i < duplicateCount; i++) {
    const rng = createRng(42 + i * 1000)
    const offsetPoints: LatLng[] = []

    routePoints.forEach((point) => {
      const randomOffset = minOffsetMeters + rng() * (maxOffsetMeters - minOffsetMeters)
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
      points.push(...generateTransitionPoints(
        points[points.length - 1],
        allLoopPoints[i + 1][0],
      ))
    }

    displayCoords.push(points)
  }

  cachedDisplayCoords = displayCoords
  return displayCoords
}

function invalidateCache() {
  cachedDisplayCoords = null
}

// --- Realtime preview ---
let rafId: number | null = null
let needsRefresh = false

function clearPreviewLayers() {
  previewLayerIds.forEach((id) => {
    if (map.getLayer(id)) map.removeLayer(id)
  })
  previewSourceIds.forEach((id) => {
    if (map.getSource(id)) map.removeSource(id)
  })
  previewLayerIds = []
  previewSourceIds = []
}

function refreshPreview() {
  if (rafId !== null) {
    needsRefresh = true
    return
  }

  rafId = requestAnimationFrame(() => {
    rafId = null
    doRefreshPreview()
    if (needsRefresh) {
      needsRefresh = false
      rafId = requestAnimationFrame(() => {
        rafId = null
        doRefreshPreview()
      })
    }
  })
}

function doRefreshPreview() {
  if (routePoints.length < 2) {
    clearPreviewLayers()
    updateRouteLine()
    updateRouteInfo(0)
    return
  }

  invalidateCache()
  const displayCoords = getDisplayCoords()
  const duplicateCount = displayCoords.length

  const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6']

  let totalPreviewDistance = 0

  // Ensure correct number of preview layers
  while (previewLayerIds.length > duplicateCount) {
    const layerId = previewLayerIds.pop()!
    const sourceId = previewSourceIds.pop()!
    if (map.getLayer(layerId)) map.removeLayer(layerId)
    if (map.getSource(sourceId)) map.removeSource(sourceId)
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
          'line-color': colors[i % colors.length],
          'line-width': 5,
          'line-opacity': 0.7,
        },
      })

      previewSourceIds.push(sourceId)
      previewLayerIds.push(layerId)
    }
  }

  // Hide base route line
  if (map.getLayer('route-line')) {
    map.setLayoutProperty('route-line', 'visibility', 'none')
  }

  updateRouteInfo(totalPreviewDistance)
}

// --- Realtime input listeners ---
const settingsInputs = [speedInput, duplicateCountInput, minOffsetInput, maxOffsetInput, elevationInput, startTimeInput]
settingsInputs.forEach((input) => {
  input.addEventListener('input', refreshPreview)
})

// --- Reset ---
function resetApp() {
  if (isDrawing) stopDrawing()

  markerElements.forEach((marker) => marker.remove())
  markerElements.length = 0

  if (map.getLayer('route-line')) map.removeLayer('route-line')
  if (map.getSource('route')) map.removeSource('route')

  clearPreviewLayers()

  routePoints = []
  userClickedPoints.length = 0

  speedInput.value = '9.6'
  duplicateCountInput.value = '1'
  minOffsetInput.value = '0.05'
  maxOffsetInput.value = '0.2'
  elevationInput.value = '10'
  setRouteType('run')

  startTimeInput.value = format(toZonedTime(new Date(), TIMEZONE), "yyyy-MM-dd'T'HH:mm")

  totalDistanceEl.textContent = '0 km'
  totalTimeEl.textContent = '0 phút'

  updateButtonStates()
}

resetAppBtn.addEventListener('click', () => {
  showConfirm('Bạn có chắc chắn muốn làm lại từ đầu?', (confirmed) => {
    if (confirmed) resetApp()
  })
})

// --- Export GPX ---
exportGpxBtn.addEventListener('click', () => {
  if (routePoints.length < 2) {
    showAlert('Bạn chưa vẽ đường chạy! Cần ít nhất 2 điểm.')
    return
  }

  const paceMinKm = parseFloat(speedInput.value) || 9.6
  const elevation = parseFloat(elevationInput.value) || 10
  const routeType = currentRouteType

  const speedMetersSec = 1000 / (paceMinKm * 60)

  let startTime: Date
  if (startTimeInput.value) {
    startTime = toZonedTime(parseISO(startTimeInput.value), TIMEZONE)
  } else {
    startTime = toZonedTime(new Date(), TIMEZONE)
  }

  const activityName = generateActivityName(startTime, routeType)

  const allRoutePoints = getDisplayCoords().flat()

  const gpxContent = generateGPX(allRoutePoints, speedMetersSec, startTime, activityName, elevation)

  const blob = new Blob([gpxContent], { type: 'application/gpx+xml' })
  const url = URL.createObjectURL(blob)

  const formattedStartTime = format(startTime, 'yyyyMMddHHmm')
  const a = document.createElement('a')
  a.href = url
  a.download = `${activityName.replace(/\s+/g, '_')}_${formattedStartTime}.gpx`
  document.body.appendChild(a)
  a.click()

  setTimeout(() => {
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }, 0)

  showAlert('File GPX đã được tạo thành công!')
})

function generateActivityName(date: Date, routeType: string): string {
  const hour = getHours(date)
  let timeOfDay: string

  if (hour >= 5 && hour < 12) timeOfDay = 'Morning'
  else if (hour >= 12 && hour < 17) timeOfDay = 'Afternoon'
  else if (hour >= 17 && hour < 21) timeOfDay = 'Evening'
  else timeOfDay = 'Night'

  const activityType = routeType === 'run' ? 'Run' : 'Walk'
  return `${timeOfDay} ${activityType}`
}

function generateGPX(
  points: LatLng[],
  speedMetersSec: number,
  startTime: Date,
  activityName: string,
  elevation: number,
): string {
  const header =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<gpx version="1.1" creator="Zero GPX Route Generator" xmlns="http://www.topografix.com/GPX/1/1">' +
    '<metadata>' +
    '<name>' + activityName + '</name>' +
    '<time>' + startTime.toISOString() + '</time>' +
    '</metadata>' +
    '<trk>' +
    '<type>running</type>' +
    '<name>' + activityName + '</name>' +
    '<trkseg>'

  let body = ''
  let currentTime = startTime
  let prevPoint: LatLng | null = null

  points.forEach((point, index) => {
    if (index > 0 && prevPoint) {
      if (point.routeIndex !== prevPoint.routeIndex) {
        currentTime = addSeconds(currentTime, 1)
      } else {
        const distance = haversineDistance(prevPoint, point)
        const timeMs = (distance / speedMetersSec) * 1000
        currentTime = addMilliseconds(currentTime, timeMs)
      }
    }

    const pointElevation = elevation + (Math.random() * 2 - 1)

    body +=
      '<trkpt lat="' + point.lat + '" lon="' + point.lng + '">' +
      '<ele>' + pointElevation.toFixed(1) + '</ele>' +
      '<time>' + currentTime.toISOString() + '</time>' +
      '</trkpt>'

    prevPoint = point
  })

  return header + body + '</trkseg></trk></gpx>'
}

updateButtonStates()
