import { addMilliseconds, getHours } from 'date-fns'
import { haversineDistance } from '../shared/geo'
import { createRng } from '../shared/random'
import type { LatLng, RouteType } from '../types/route'

export function generateActivityName(date: Date, routeType: RouteType): string {
  const hour = getHours(date)
  let timeOfDay: string

  if (hour >= 5 && hour < 12) timeOfDay = 'Morning'
  else if (hour >= 12 && hour < 17) timeOfDay = 'Afternoon'
  else if (hour >= 17 && hour < 21) timeOfDay = 'Evening'
  else timeOfDay = 'Night'

  const activityType = routeType === 'run' ? 'Run' : 'Walk'
  return `${timeOfDay} ${activityType}`
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function generateGPX(
  points: LatLng[],
  speedMetersSec: number,
  startTime: Date,
  activityName: string,
  elevation: number,
): string {
  const safeName = escapeXml(activityName)
  const safeSpeed = speedMetersSec > 0 ? speedMetersSec : 1

  const header =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<gpx version="1.1" creator="Zero GPX Route Generator" xmlns="http://www.topografix.com/GPX/1/1">' +
    '<metadata>' +
    '<name>' + safeName + '</name>' +
    '<time>' + startTime.toISOString() + '</time>' +
    '</metadata>' +
    '<trk>' +
    '<type>running</type>' +
    '<name>' + safeName + '</name>' +
    '<trkseg>'

  // Seeded elevation jitter so successive exports are reproducible.
  const eleRng = createRng(Math.max(1, Math.floor(elevation * 100) || 1))

  let body = ''
  let currentTime = startTime
  let prevPoint: LatLng | null = null

  points.forEach((point, index) => {
    if (index > 0 && prevPoint) {
      const distance = haversineDistance(prevPoint, point)
      const timeMs = (distance / safeSpeed) * 1000
      currentTime = addMilliseconds(currentTime, timeMs)
    }

    const jitter = (eleRng() * 2 - 1)
    const pointElevation = Math.max(0, elevation + jitter)

    body +=
      '<trkpt lat="' + point.lat + '" lon="' + point.lng + '">' +
      '<ele>' + pointElevation.toFixed(1) + '</ele>' +
      '<time>' + currentTime.toISOString() + '</time>' +
      '</trkpt>'

    prevPoint = point
  })

  return header + body + '</trkseg></trk></gpx>'
}
