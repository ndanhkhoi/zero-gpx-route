import { useEffect, useState } from 'react'
import { Modal } from './modal'

interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
}

interface Step {
  icon: string
  title: string
  body: string
}

const STEPS: Step[] = [
  {
    icon: 'fa-map-location-dot',
    title: 'Tìm địa điểm',
    body: 'Nhập tên đường, phường, hoặc địa danh vào thanh tìm kiếm góc trên-trái bản đồ. Chọn kết quả để bay tới vị trí đó. Cũng có thể bấm icon định vị (góc trên-phải) để dùng GPS thiết bị.',
  },
  {
    icon: 'fa-pen-to-square',
    title: 'Bắt đầu vẽ',
    body: 'Bấm "Bắt đầu vẽ" trên thanh công cụ. Khi đang vẽ, có thể chấm để thêm điểm anchor (kéo được sau đó), hoặc nhấn-giữ rồi kéo để vẽ tự do. Mix tuỳ ý trong cùng một tuyến.',
  },
  {
    icon: 'fa-arrows-up-down-left-right',
    title: 'Chỉnh sửa',
    body: 'Mỗi điểm chấm trên bản đồ kéo được để dời, bấm vào để xoá. Dùng nút "Hoàn tác" hoặc Cmd/Ctrl+Z để gỡ thao tác cuối. Muốn xoá toàn bộ đường mà giữ thông số dùng "Xoá đường".',
  },
  {
    icon: 'fa-sliders',
    title: 'Tinh chỉnh thông số',
    body: 'Chọn loại hoạt động (Chạy/Đi bộ), thời gian bắt đầu, pace, số vòng lặp. Mở "Tuỳ chỉnh nâng cao" nếu muốn điều chỉnh độ lệch giữa các vòng và độ cao mặc định.',
  },
  {
    icon: 'fa-file-export',
    title: 'Xuất GPX',
    body: 'Bấm "Xuất GPX". File tải về có timestamp, elevation, tên hoạt động tự động theo thời gian (Morning/Afternoon/Evening/Night). Có thể upload lên Strava, Garmin Connect, hoặc bất kỳ app nào hỗ trợ GPX.',
  },
]

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [step, setStep] = useState(0)

  // Reset to first step on every open.
  useEffect(() => {
    if (isOpen) setStep(0)
  }, [isOpen])

  // Arrow keys navigate between steps while open.
  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') setStep((s) => Math.min(STEPS.length - 1, s + 1))
      if (e.key === 'ArrowLeft') setStep((s) => Math.max(0, s - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen])

  const current = STEPS[step]
  const isFirst = step === 0
  const isLast = step === STEPS.length - 1

  return (
    <Modal isOpen={isOpen} onClose={onClose} labelledBy="help-modal-title" size="md">
      <header className="app-modal-header app-modal-header-split">
        <span className="help-step-counter">Bước {step + 1} / {STEPS.length}</span>
        <button type="button" className="app-modal-icon-btn" onClick={onClose} aria-label="Đóng">
          <i className="fas fa-xmark" aria-hidden="true" />
        </button>
      </header>

      <div className="help-step-icon" aria-hidden="true">
        <i className={`fas ${current.icon}`} />
      </div>

      <h3 id="help-modal-title" className="help-step-title">{current.title}</h3>
      <p className="help-step-body">{current.body}</p>

      <div className="help-progress" aria-hidden="true">
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={`help-progress-dot${i === step ? ' is-active' : ''}${i < step ? ' is-done' : ''}`}
          />
        ))}
      </div>

      <footer className="app-modal-footer app-modal-footer-spread">
        <button
          type="button"
          className="app-modal-btn app-modal-btn-secondary"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={isFirst}
        >
          <i className="fas fa-arrow-left" aria-hidden="true" /> Trước
        </button>
        {isLast ? (
          <button type="button" className="app-modal-btn app-modal-btn-primary" onClick={onClose}>
            Bắt đầu <i className="fas fa-check" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            className="app-modal-btn app-modal-btn-primary"
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
          >
            Tiếp <i className="fas fa-arrow-right" aria-hidden="true" />
          </button>
        )}
      </footer>
    </Modal>
  )
}
