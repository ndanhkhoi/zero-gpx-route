interface RouteStatusProps {
  totalDistanceMeters: number
  paceMinPerKm: number
  isDrawing: boolean
  hasRoute: boolean
}

function formatDistance(distanceMeters: number): string {
  return `${(distanceMeters / 1000).toFixed(2)} km`
}

function formatTime(distanceMeters: number, paceMinPerKm: number): string {
  if (paceMinPerKm <= 0 || !Number.isFinite(paceMinPerKm)) return '—'
  const distanceKm = distanceMeters / 1000
  const totalMinutes = distanceKm * paceMinPerKm
  if (!Number.isFinite(totalMinutes)) return '—'
  const hours = Math.floor(totalMinutes / 60)
  const minutes = Math.floor(totalMinutes % 60)
  return hours > 0 ? `${hours}g ${minutes} phút` : `${minutes} phút`
}

export function RouteStatus({ totalDistanceMeters, paceMinPerKm, isDrawing, hasRoute }: RouteStatusProps) {
  const statusLabel = isDrawing ? 'Đang vẽ điểm' : hasRoute ? 'Sẵn sàng xuất GPX' : 'Sẵn sàng'
  const statusClass = isDrawing
    ? 'status-pill status-pill-drawing'
    : 'status-pill status-pill-ready'

  return (
    <div className="flex flex-wrap items-center gap-2" aria-live="polite">
      <span className="text-sm font-semibold text-[var(--color-slate-300)]">
        {formatDistance(totalDistanceMeters)}
      </span>
      <span className="text-[var(--color-border)]">|</span>
      <span className="text-sm font-semibold text-[var(--color-slate-300)]">
        {formatTime(totalDistanceMeters, paceMinPerKm)}
      </span>
      <span className={statusClass}>
        {isDrawing && <span className="status-dot" aria-hidden="true" />}
        {statusLabel}
      </span>
    </div>
  )
}
