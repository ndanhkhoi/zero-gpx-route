function mustGet<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id)
  if (!el) throw new Error(`Missing required element: #${id}`)
  return el as T
}

export interface DomElements {
  addPointBtn: HTMLButtonElement
  resetAppBtn: HTMLButtonElement
  exportGpxBtn: HTMLButtonElement
  speedInput: HTMLInputElement
  speedValueEl: HTMLInputElement
  startTimeInput: HTMLInputElement
  totalDistanceEl: HTMLElement
  totalTimeEl: HTMLElement
  drawStatusEl: HTMLElement
  routeTypeGroup: HTMLElement
  routeTypeBtns: NodeListOf<HTMLButtonElement>
  drawModeGroup: HTMLElement
  drawModeBtns: NodeListOf<HTMLButtonElement>
  duplicateCountInput: HTMLInputElement
  duplicateCountValueEl: HTMLInputElement
  minOffsetInput: HTMLInputElement
  minOffsetValueEl: HTMLInputElement
  maxOffsetInput: HTMLInputElement
  maxOffsetValueEl: HTMLInputElement
  elevationInput: HTMLInputElement
  elevationValueEl: HTMLInputElement
}

export function getDomElements(): DomElements {
  const routeTypeGroup = mustGet<HTMLElement>('route-type-group')
  const drawModeGroup = mustGet<HTMLElement>('draw-mode-group')

  return {
    addPointBtn: mustGet<HTMLButtonElement>('add-point'),
    resetAppBtn: mustGet<HTMLButtonElement>('reset-app'),
    exportGpxBtn: mustGet<HTMLButtonElement>('export-gpx'),
    speedInput: mustGet<HTMLInputElement>('speed'),
    speedValueEl: mustGet<HTMLInputElement>('speed-value'),
    startTimeInput: mustGet<HTMLInputElement>('start-time'),
    totalDistanceEl: mustGet<HTMLElement>('total-distance'),
    totalTimeEl: mustGet<HTMLElement>('total-time'),
    drawStatusEl: mustGet<HTMLElement>('draw-status'),
    routeTypeGroup,
    routeTypeBtns: routeTypeGroup.querySelectorAll('.route-type-btn') as NodeListOf<HTMLButtonElement>,
    drawModeGroup,
    drawModeBtns: drawModeGroup.querySelectorAll('.draw-mode-btn') as NodeListOf<HTMLButtonElement>,
    duplicateCountInput: mustGet<HTMLInputElement>('duplicate-count'),
    duplicateCountValueEl: mustGet<HTMLInputElement>('duplicate-count-value'),
    minOffsetInput: mustGet<HTMLInputElement>('min-offset'),
    minOffsetValueEl: mustGet<HTMLInputElement>('min-offset-value'),
    maxOffsetInput: mustGet<HTMLInputElement>('max-offset'),
    maxOffsetValueEl: mustGet<HTMLInputElement>('max-offset-value'),
    elevationInput: mustGet<HTMLInputElement>('elevation'),
    elevationValueEl: mustGet<HTMLInputElement>('elevation-value'),
  }
}
