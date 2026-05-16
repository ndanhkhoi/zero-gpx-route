interface MapToolbarProps {
  isDrawing: boolean
  hasRoute: boolean
  canUndo: boolean
  onToggleDrawing: () => void
  onUndo: () => void
  onClearRoute: () => void
  onResetAll: () => void
}

export function MapToolbar({
  isDrawing,
  hasRoute,
  canUndo,
  onToggleDrawing,
  onUndo,
  onClearRoute,
  onResetAll,
}: MapToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        title={isDrawing ? 'Dừng vẽ' : 'Bắt đầu vẽ'}
        className={`toolbar-btn toolbar-btn-primary${isDrawing ? ' active' : ''}`}
        onClick={onToggleDrawing}
      >
        <i className={`fas ${isDrawing ? 'fa-stop' : 'fa-pen-to-square'}`} aria-hidden="true" />
        <span className="btn-label">{isDrawing ? 'Dừng vẽ' : 'Bắt đầu vẽ'}</span>
      </button>

      <button
        type="button"
        title="Hoàn tác (Ctrl/Cmd+Z)"
        className="toolbar-btn toolbar-btn-ghost"
        onClick={onUndo}
        disabled={!canUndo}
      >
        <i className="fas fa-rotate-left" aria-hidden="true" />
        <span className="btn-label">Hoàn tác</span>
      </button>

      <button
        type="button"
        title="Xoá đường vẽ"
        className="toolbar-btn toolbar-btn-ghost"
        onClick={onClearRoute}
        disabled={!hasRoute && !canUndo}
      >
        <i className="fas fa-eraser" aria-hidden="true" />
        <span className="btn-label">Xoá đường</span>
      </button>

      <button
        type="button"
        title="Đặt lại toàn bộ (đường + thông số)"
        className="toolbar-btn toolbar-btn-ghost"
        onClick={onResetAll}
      >
        <i className="fas fa-arrows-rotate" aria-hidden="true" />
        <span className="btn-label">Đặt lại</span>
      </button>

      {isDrawing && (
        <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-[var(--color-slate-400)] pl-1">
          <i className="fas fa-circle-info text-[var(--color-primary)]" aria-hidden="true" />
          Chấm để thêm điểm · Kéo để vẽ tự do · Bấm điểm để xoá
        </span>
      )}
    </div>
  )
}
