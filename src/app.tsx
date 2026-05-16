import { useCallback, useEffect, useRef, useState } from 'react'
import { AppHeader } from './components/app-header'
import { ControlPanel } from './components/control-panel'
import { DarkModal } from './components/dark-modal'
import { HelpModal } from './components/help-modal'
import { MapCanvas } from './components/map-canvas'
import { MapToolbar } from './components/map-toolbar'
import { RouteStatus } from './components/route-status'
import { exportRouteAsGpx } from './export/export-controller'
import { useDrawing } from './hooks/use-drawing'
import { useMapInstance } from './hooks/use-map-instance'
import { useModal } from './hooks/use-modal'
import { usePreviewRenderer } from './hooks/use-preview-renderer'
import { useRoutePoints } from './hooks/use-route-points'
import { useRouteSettings } from './hooks/use-route-settings'
import { parseStartTimeInput } from './shared/time'
import type { LatLng } from './types/route'

export function App() {
  const { containerRef, map } = useMapInstance()
  const { settings, updateSetting, setRouteType, resetSettings } = useRouteSettings()
  const {
    routePoints,
    anchors,
    appendAnchor,
    startStroke,
    appendStrokePoint,
    moveAnchor,
    removeSegment,
    popLastSegment,
    resetSegments,
    hasRoute,
    hasSegments,
  } = useRoutePoints()

  const [isDrawing, setIsDrawing] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [totalDistanceMeters, setTotalDistanceMeters] = useState(0)
  const displayCoordsRef = useRef<LatLng[][]>([])
  const modal = useModal()

  const { clearMarkers } = useDrawing({
    map,
    isDrawing,
    appendAnchor,
    startStroke,
    appendStrokePoint,
    moveAnchor,
    removeAnchor: removeSegment,
    anchors,
  })

  const onDisplayCoordsChange = useCallback((coords: LatLng[][]) => {
    displayCoordsRef.current = coords
  }, [])

  const { clearAll: clearPreview } = usePreviewRenderer({
    map,
    routePoints,
    duplicateCount: settings.duplicateCount,
    offsetMinMeters: settings.offsetMinMeters,
    offsetMaxMeters: settings.offsetMaxMeters,
    onRouteInfo: setTotalDistanceMeters,
    onDisplayCoordsChange,
  })

  function clearRouteOnly() {
    setIsDrawing(false)
    clearMarkers()
    clearPreview()
    resetSegments()
    setTotalDistanceMeters(0)
    displayCoordsRef.current = []
  }

  function performResetAll() {
    clearRouteOnly()
    resetSettings()
  }

  function onToggleDrawing() {
    if (isDrawing) {
      setIsDrawing(false)
      return
    }
    setIsDrawing(true)
  }

  function onUndo() {
    if (!hasSegments) return
    popLastSegment()
  }

  function onClearRoute() {
    if (!hasSegments) return
    modal.showConfirm('Xoá toàn bộ đường đã vẽ?', (ok) => {
      if (ok) clearRouteOnly()
    })
  }

  function onResetAll() {
    modal.showConfirm('Đặt lại toàn bộ đường vẽ và thông số?', (ok) => {
      if (ok) performResetAll()
    })
  }

  // Keyboard undo
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (hasSegments) popLastSegment()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [hasSegments, popLastSegment])

  function onExport() {
    const flat = displayCoordsRef.current.flat()
    exportRouteAsGpx({
      points: flat.length > 0 ? flat : routePoints,
      paceMinPerKm: settings.paceMinPerKm,
      elevation: settings.elevation,
      startTime: parseStartTimeInput(settings.startTime),
      routeType: settings.routeType,
      onError: modal.showAlert,
      onSuccess: modal.showAlert,
    })
  }

  const showEmptyHint = !isDrawing && !hasRoute

  return (
    <>
      <AppHeader onOpenHelp={() => setIsHelpOpen(true)} />
      <div className="max-w-[1800px] mx-auto p-3 pt-[68px] sm:pt-20 lg:p-6 lg:pt-24 grid gap-4 sm:gap-5">
        <main
          className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,420px)] gap-6"
          aria-label="Route generator workspace"
        >
          <section
            className="surface-card panel-soft p-3 sm:p-4 grid gap-3 rounded-2xl bg-[rgba(18,26,43,0.96)]"
            aria-label="Map canvas"
          >
            <div className="flex items-center gap-2 font-semibold text-[var(--color-slate-100)]">
              <i className="fas fa-map-location-dot text-[var(--color-primary)]" aria-hidden="true" /> Bản đồ
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <MapToolbar
                isDrawing={isDrawing}
                hasRoute={hasRoute}
                canUndo={hasSegments}
                onToggleDrawing={onToggleDrawing}
                onUndo={onUndo}
                onClearRoute={onClearRoute}
                onResetAll={onResetAll}
              />
              <RouteStatus
                totalDistanceMeters={totalDistanceMeters}
                paceMinPerKm={settings.paceMinPerKm}
                isDrawing={isDrawing}
                hasRoute={hasRoute}
              />
            </div>
            {isDrawing && (
              <div className="sm:hidden flex items-center gap-1.5 text-[11px] text-[var(--color-slate-400)]">
                <i className="fas fa-circle-info text-[var(--color-primary)]" aria-hidden="true" />
                Chấm để thêm điểm · Kéo để vẽ · Bấm điểm để xoá
              </div>
            )}
            <div className="relative">
              <MapCanvas ref={containerRef} map={map} />
              {showEmptyHint && (
                <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-4 px-3 py-2 rounded-full bg-[rgba(11,18,32,0.78)] border border-[var(--color-border)] backdrop-blur-sm text-[12px] text-[var(--color-slate-300)] flex items-center gap-2">
                  <i className="fas fa-pen-to-square text-[var(--color-primary)]" aria-hidden="true" />
                  Bấm "Bắt đầu vẽ" rồi chấm hoặc kéo trên bản đồ
                </div>
              )}
            </div>
          </section>

          <ControlPanel
            settings={settings}
            disabled={false}
            exportDisabled={isDrawing || !hasRoute}
            onRouteTypeChange={setRouteType}
            onSettingChange={updateSetting}
            onExport={onExport}
          />
        </main>
      </div>
      <DarkModal isOpen={modal.isOpen} modal={modal.modal} onBackdropClick={modal.closeModal} />
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </>
  )
}
