import type { RouteType } from '../types/route'

export interface RoutePreset {
  paceMinPerKm: number
  offsetMinMeters: number
  offsetMaxMeters: number
  elevation: number
}

export const ROUTE_PRESETS: Record<RouteType, RoutePreset> = {
  run: { paceMinPerKm: 9.6, offsetMinMeters: 0.05, offsetMaxMeters: 0.2, elevation: 10 },
  walk: { paceMinPerKm: 12, offsetMinMeters: 0.1, offsetMaxMeters: 0.5, elevation: 5 },
}

export const DEFAULT_ROUTE_TYPE: RouteType = 'run'

export const DEFAULT_SETTINGS = {
  ...ROUTE_PRESETS[DEFAULT_ROUTE_TYPE],
  duplicateCount: 1,
} as const
