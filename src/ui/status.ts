interface StatusArgs {
  isDrawing: boolean
  hasRoute: boolean
  exportBtn: HTMLButtonElement
  drawStatusEl: HTMLElement
  drawModeBtns: NodeListOf<HTMLButtonElement>
  routeTypeBtns: NodeListOf<HTMLButtonElement>
  settingsInputs: HTMLInputElement[]
}

export function updateButtonStates({ isDrawing, hasRoute, exportBtn, drawStatusEl, drawModeBtns, routeTypeBtns, settingsInputs }: StatusArgs) {
  exportBtn.disabled = isDrawing || !hasRoute
  drawStatusEl.textContent = isDrawing ? 'Đang vẽ điểm' : hasRoute ? 'Sẵn sàng xuất GPX' : 'Sẵn sàng'
  drawStatusEl.classList.toggle('is-drawing', isDrawing)

  drawModeBtns.forEach((btn) => (btn.disabled = isDrawing))
  routeTypeBtns.forEach((btn) => (btn.disabled = isDrawing))
  settingsInputs.forEach((input) => (input.disabled = isDrawing))
}

export function updateRouteInfo(
  totalPreviewDistance: number,
  paceMinPerKm: number,
  totalDistanceEl: HTMLElement,
  totalTimeEl: HTMLElement,
) {
  const distanceKm = (totalPreviewDistance / 1000).toFixed(2)
  totalDistanceEl.textContent = `${distanceKm} km`

  const totalMinutes = parseFloat(distanceKm) * paceMinPerKm
  const hours = Math.floor(totalMinutes / 60)
  const minutes = Math.floor(totalMinutes % 60)
  totalTimeEl.textContent = hours > 0 ? `${hours}g ${minutes} phút` : `${minutes} phút`
}
