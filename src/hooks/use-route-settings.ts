import { useCallback, useState } from 'react'
import { ROUTE_PRESETS, DEFAULT_SETTINGS, DEFAULT_ROUTE_TYPE } from '../shared/presets'
import { getDefaultStartTimeValue } from '../shared/time'
import type { RouteType } from '../types/route'
import type { RouteSettings } from '../types/settings'

const INITIAL_SETTINGS: RouteSettings = {
  paceMinPerKm: DEFAULT_SETTINGS.paceMinPerKm,
  duplicateCount: DEFAULT_SETTINGS.duplicateCount,
  offsetMinMeters: DEFAULT_SETTINGS.offsetMinMeters,
  offsetMaxMeters: DEFAULT_SETTINGS.offsetMaxMeters,
  elevation: DEFAULT_SETTINGS.elevation,
  startTime: getDefaultStartTimeValue(),
  routeType: DEFAULT_ROUTE_TYPE,
}

export interface UseRouteSettingsResult {
  settings: RouteSettings
  updateSetting: <K extends keyof RouteSettings>(key: K, value: RouteSettings[K]) => void
  setRouteType: (type: RouteType) => void
  resetSettings: () => void
}

export function useRouteSettings(): UseRouteSettingsResult {
  const [settings, setSettings] = useState<RouteSettings>(INITIAL_SETTINGS)

  const updateSetting = useCallback(<K extends keyof RouteSettings>(key: K, value: RouteSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }, [])

  const setRouteType = useCallback((type: RouteType) => {
    const preset = ROUTE_PRESETS[type]
    setSettings((prev) => ({
      ...prev,
      routeType: type,
      paceMinPerKm: preset.paceMinPerKm,
      offsetMinMeters: preset.offsetMinMeters,
      offsetMaxMeters: preset.offsetMaxMeters,
      elevation: preset.elevation,
    }))
  }, [])

  const resetSettings = useCallback(() => {
    setSettings({ ...INITIAL_SETTINGS, startTime: getDefaultStartTimeValue() })
  }, [])

  return { settings, updateSetting, setRouteType, resetSettings }
}
