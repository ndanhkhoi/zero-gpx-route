import { format } from 'date-fns'
import { saveAs } from 'file-saver'
import type { LatLng, RouteType } from '../types/route'
import { generateActivityName, generateGPX } from './gpx-generator'

const MAX_POINTS = 10000

interface ExportRouteArgs {
  points: LatLng[]
  paceMinPerKm: number
  elevation: number
  startTime: Date
  routeType: RouteType
  onError: (message: string) => void
  onSuccess: (message: string) => void
}

// Uniformly sub-sample to keep at most MAX_POINTS so apps like Strava/Garmin
// can ingest the file without choking. Always preserves first and last points.
function subsample(points: LatLng[], max: number): LatLng[] {
  if (points.length <= max) return points
  const result: LatLng[] = []
  const step = (points.length - 1) / (max - 1)
  for (let i = 0; i < max; i++) {
    const idx = Math.round(i * step)
    result.push(points[idx])
  }
  return result
}

export function exportRouteAsGpx(args: ExportRouteArgs) {
  const { points, paceMinPerKm, elevation, startTime, routeType, onError, onSuccess } = args

  if (points.length < 2) {
    onError('Bạn chưa vẽ đường chạy! Cần ít nhất 2 điểm.')
    return
  }

  const reduced = subsample(points, MAX_POINTS)
  const wasReduced = reduced.length < points.length

  const speedMetersSec = 1000 / (paceMinPerKm * 60)
  const activityName = generateActivityName(startTime, routeType)
  const gpxContent = generateGPX(reduced, speedMetersSec, startTime, activityName, elevation)

  const blob = new Blob([gpxContent], { type: 'application/gpx+xml;charset=utf-8' })
  const formattedStartTime = format(startTime, 'yyyyMMddHHmm')
  const filename = `${activityName.replace(/\s+/g, '_')}_${formattedStartTime}.gpx`
  saveAs(blob, filename)

  if (wasReduced) {
    onSuccess(`File GPX đã tạo (rút gọn ${points.length.toLocaleString()} → ${reduced.length.toLocaleString()} điểm).`)
  } else {
    onSuccess('File GPX đã được tạo thành công!')
  }
}
