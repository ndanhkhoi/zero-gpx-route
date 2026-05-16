import { RouteTypeToggle } from './route-type-toggle'
import { SliderField } from './slider-field'
import { DateTimePicker } from './date-time-picker'
import { Tooltip } from './tooltip'
import type { RouteSettings } from '../types/settings'
import type { RouteType } from '../types/route'

interface ControlPanelProps {
  settings: RouteSettings
  disabled: boolean
  exportDisabled: boolean
  onRouteTypeChange: (value: RouteType) => void
  onSettingChange: <K extends keyof RouteSettings>(key: K, value: RouteSettings[K]) => void
  onExport: () => void
}

export function ControlPanel({
  settings,
  disabled,
  exportDisabled,
  onRouteTypeChange,
  onSettingChange,
  onExport,
}: ControlPanelProps) {
  return (
    <aside
      className="surface-card panel-soft p-3 sm:p-4 grid gap-3 content-start rounded-2xl bg-[rgba(18,26,43,0.96)] lg:max-h-[calc(75vh+120px)] lg:overflow-y-auto"
      aria-label="Route controls"
    >
      <header className="panel-header flex items-center justify-between gap-2 pb-3">
        <h2 className="text-base inline-flex items-center gap-2.5 font-semibold">
          <i className="fas fa-sliders text-[var(--color-primary)]" aria-hidden="true" />
          Thông số
        </h2>
      </header>

      <div className="grid gap-2.5">
        <div className={`setting-card${disabled ? ' is-disabled' : ''}`}>
          <div className="setting-label">
            <span className="setting-icon" aria-hidden="true"><i className="fas fa-person-running" /></span>
            <span>Loại</span>
            <Tooltip
              label="Giải thích: Loại hoạt động"
              content="Chọn Chạy bộ hoặc Đi bộ. Khi đổi, các thông số pace, độ lệch, độ cao tự khớp preset phù hợp."
            />
          </div>
          <RouteTypeToggle value={settings.routeType} disabled={disabled} onChange={onRouteTypeChange} />
        </div>

        <div className={`setting-card${disabled ? ' is-disabled' : ''}`}>
          <div className="setting-label">
            <span className="setting-icon" aria-hidden="true"><i className="fas fa-clock" /></span>
            <span>Bắt đầu</span>
            <Tooltip
              label="Giải thích: Thời gian bắt đầu"
              content="Thời điểm bắt đầu hoạt động trong file GPX (giờ Việt Nam). Timestamps các điểm trong tuyến sẽ được tính tiếp từ đây."
            />
          </div>
          <DateTimePicker
            value={settings.startTime}
            disabled={disabled}
            onChange={(v) => onSettingChange('startTime', v)}
            ariaLabel="Chọn thời gian bắt đầu"
          />
        </div>
      </div>

      <SliderField
        label="Pace"
        icon="fa-stopwatch"
        unit="phút/km"
        hint="Tốc độ trung bình tính theo phút trên mỗi km. Pace càng nhỏ thì chạy/đi càng nhanh, thời lượng GPX càng ngắn."
        min={1}
        max={30}
        step={0.1}
        value={settings.paceMinPerKm}
        disabled={disabled}
        onChange={(v) => onSettingChange('paceMinPerKm', v)}
      />

      <SliderField
        label="Số vòng"
        icon="fa-repeat"
        unit="vòng"
        hint="Số lần lặp lại tuyến đường. Mỗi vòng sẽ được dịch ngẫu nhiên theo độ lệch để không trùng nhau, nối với nhau bằng đường cong mềm."
        min={1}
        max={100}
        step={1}
        value={settings.duplicateCount}
        disabled={disabled}
        onChange={(v) => onSettingChange('duplicateCount', v)}
      />

      <details className="advanced-settings">
        <summary className="advanced-summary">
          <i className="fas fa-chevron-right advanced-chevron" aria-hidden="true" />
          <span>Tuỳ chỉnh nâng cao</span>
          <span className="advanced-hint">Độ lệch · Độ cao</span>
        </summary>
        <div className="grid gap-2.5 pt-3">
          <SliderField
            label="Độ lệch nhỏ"
            icon="fa-arrows-left-right"
            unit="m"
            hint="Khoảng dịch ngang TỐI THIỂU mỗi điểm (mét) khi sinh các vòng lặp. Giá trị càng nhỏ thì các vòng càng gần đường gốc."
            min={0.01}
            max={10}
            step={0.01}
            value={settings.offsetMinMeters}
            disabled={disabled}
            onChange={(v) => onSettingChange('offsetMinMeters', v)}
          />

          <SliderField
            label="Độ lệch lớn"
            icon="fa-arrows-left-right"
            unit="m"
            hint="Khoảng dịch ngang TỐI ĐA mỗi điểm (mét). Tăng giá trị này để các vòng lặp toả rộng và trông tự nhiên hơn."
            min={0.01}
            max={10}
            step={0.01}
            value={settings.offsetMaxMeters}
            disabled={disabled}
            onChange={(v) => onSettingChange('offsetMaxMeters', v)}
          />

          <SliderField
            label="Độ cao"
            icon="fa-mountain"
            unit="m"
            hint="Giá trị elevation cố định ghi vào file GPX cho mọi điểm, có thêm jitter nhỏ ±1 m để trông thật hơn."
            min={0}
            max={8888}
            step={1}
            value={settings.elevation}
            disabled={disabled}
            onChange={(v) => onSettingChange('elevation', v)}
          />
        </div>
      </details>

      <button
        type="button"
        disabled={exportDisabled}
        onClick={onExport}
        className="mt-1 flex items-center justify-center gap-2 w-full min-h-12 rounded-xl bg-[var(--color-primary)] text-white font-semibold text-sm transition-all duration-200 shadow-[0_8px_22px_-10px_rgba(249,115,22,0.7)] hover:bg-[var(--color-primary-hover)] active:translate-y-[1px] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
      >
        <i className="fas fa-file-export" aria-hidden="true" />
        <span>Xuất GPX</span>
      </button>
    </aside>
  )
}
