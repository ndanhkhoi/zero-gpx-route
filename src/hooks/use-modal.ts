import { useCallback, useEffect, useRef, useState } from 'react'

interface ModalButton {
  text: string
  primary: boolean
  onClick: () => void
}

interface ModalConfig {
  title: string
  body: string
  buttons: ModalButton[]
}

export interface UseModalResult {
  modal: ModalConfig | null
  isOpen: boolean
  showAlert: (message: string) => void
  showConfirm: (message: string, callback: (ok: boolean) => void) => void
  closeModal: () => void
}

const DISMISS_DURATION_MS = 220

export function useModal(): UseModalResult {
  const [modal, setModal] = useState<ModalConfig | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const dismissTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current !== null) window.clearTimeout(dismissTimerRef.current)
    }
  }, [])

  const closeModal = useCallback(() => {
    setIsOpen(false)
    if (dismissTimerRef.current !== null) window.clearTimeout(dismissTimerRef.current)
    dismissTimerRef.current = window.setTimeout(() => {
      setModal(null)
      dismissTimerRef.current = null
    }, DISMISS_DURATION_MS)
  }, [])

  const openModal = useCallback((config: ModalConfig) => {
    if (dismissTimerRef.current !== null) {
      window.clearTimeout(dismissTimerRef.current)
      dismissTimerRef.current = null
    }
    setModal(config)
    requestAnimationFrame(() => setIsOpen(true))
  }, [])

  const showAlert = useCallback(
    (message: string) => {
      openModal({
        title: 'Thông báo',
        body: message,
        buttons: [{ text: 'OK', primary: true, onClick: closeModal }],
      })
    },
    [openModal, closeModal],
  )

  const showConfirm = useCallback(
    (message: string, callback: (ok: boolean) => void) => {
      let resolved = false
      const resolveOnce = (ok: boolean) => {
        if (resolved) return
        resolved = true
        closeModal()
        callback(ok)
      }
      openModal({
        title: 'Xác nhận',
        body: message,
        buttons: [
          { text: 'Hủy', primary: false, onClick: () => resolveOnce(false) },
          { text: 'Đồng ý', primary: true, onClick: () => resolveOnce(true) },
        ],
      })
    },
    [openModal, closeModal],
  )

  return { modal, isOpen, showAlert, showConfirm, closeModal }
}
