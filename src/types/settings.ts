import type { RouteType } from './route'

export interface RouteSettings {
  paceMinPerKm: number
  duplicateCount: number
  offsetMinMeters: number
  offsetMaxMeters: number
  elevation: number
  startTime: string
  routeType: RouteType
}
