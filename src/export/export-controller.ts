import { format } from 'date-fns'
import { saveAs } from 'file-saver'
import type { LatLng, RouteType } from '../types/route'
import { generateActivityName, generateGPX } from './gpx-generator'

interface ExportRouteArgs {
  points: LatLng[]
  paceMinPerKm: number
  elevation: number
  startTime: Date
  routeType: RouteType
  onError: (message: string) => void
  onSuccess: (message: string) => void
}

export function exportRouteAsGpx(args: ExportRouteArgs) {
  const { points, paceMinPerKm, elevation, startTime, routeType, onError, onSuccess } = args

  if (points.length < 2) {
    onError('Bạn chưa vẽ đường chạy! Cần ít nhất 2 điểm.')
    return
  }

  const speedMetersSec = 1000 / (paceMinPerKm * 60)
  const activityName = generateActivityName(startTime, routeType)
  const gpxContent = generateGPX(points, speedMetersSec, startTime, activityName, elevation)

  const blob = new Blob([gpxContent], { type: 'application/gpx+xml;charset=utf-8' })
  const formattedStartTime = format(startTime, 'yyyyMMddHHmm')
  const filename = `${activityName.replace(/\s+/g, '_')}_${formattedStartTime}.gpx`
  saveAs(blob, filename)

  onSuccess('File GPX đã được tạo thành công!')
}
