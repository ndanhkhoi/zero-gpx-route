interface ModalButton {
  text: string
  primary: boolean
  action: () => void
}

function createModal(title: string, body: string, buttons: ModalButton[]): HTMLDivElement {
  const modal = document.createElement('div')
  modal.className = 'dark-modal'

  const header = document.createElement('div')
  header.className = 'dark-modal-header'
  const heading = document.createElement('h3')
  heading.className = 'text-lg font-semibold'
  heading.textContent = title
  header.appendChild(heading)
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

function dismissOverlay(overlay: HTMLDivElement) {
  overlay.classList.remove('open')
  overlay.addEventListener('transitionend', () => overlay.remove(), { once: true })
}

export function showAlert(message: string) {
  const overlay = createModalOverlay()
  const modal = createModal('Thông báo', message, [
    { text: 'OK', primary: true, action: () => dismissOverlay(overlay) },
  ])
  overlay.appendChild(modal)
  document.body.appendChild(overlay)
}

export function showConfirm(message: string, callback: (ok: boolean) => void) {
  const overlay = createModalOverlay()
  const modal = createModal('Xác nhận', message, [
    {
      text: 'Hủy',
      primary: false,
      action: () => {
        dismissOverlay(overlay)
        callback(false)
      },
    },
    {
      text: 'Đồng ý',
      primary: true,
      action: () => {
        dismissOverlay(overlay)
        callback(true)
      },
    },
  ])
  overlay.appendChild(modal)
  document.body.appendChild(overlay)
}
