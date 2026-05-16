import { Modal } from './modal'

interface DialogButton {
  text: string
  primary: boolean
  onClick: () => void
}

interface DialogConfig {
  title: string
  body: string
  buttons: DialogButton[]
}

interface DarkModalProps {
  isOpen: boolean
  modal: DialogConfig | null
  onBackdropClick: () => void
}

export function DarkModal({ isOpen, modal, onBackdropClick }: DarkModalProps) {
  if (!modal) return null

  return (
    <Modal isOpen={isOpen} onClose={onBackdropClick} labelledBy="dialog-title" size="sm">
      <header className="app-modal-header">
        <h3 id="dialog-title" className="app-modal-title">{modal.title}</h3>
      </header>
      <div className="app-modal-body">{modal.body}</div>
      <footer className="app-modal-footer">
        {modal.buttons.map((btn, idx) => (
          <button
            key={idx}
            type="button"
            className={`app-modal-btn ${btn.primary ? 'app-modal-btn-primary' : 'app-modal-btn-secondary'}`}
            onClick={btn.onClick}
          >
            {btn.text}
          </button>
        ))}
      </footer>
    </Modal>
  )
}
