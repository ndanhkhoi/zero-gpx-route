import { addMilliseconds, addSeconds, getHours } from 'date-fns'
import { haversineDistance } from '../shared/geo'
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

export function generateGPX(
  points: LatLng[],
  speedMetersSec: number,
  startTime: Date,
  activityName: string,
  elevation: number,
): string {
  const header =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<gpx version="1.1" creator="Zero GPX Route Generator" xmlns="http://www.topografix.com/GPX/1/1">' +
    '<metadata>' +
    '<name>' + activityName + '</name>' +
    '<time>' + startTime.toISOString() + '</time>' +
    '</metadata>' +
    '<trk>' +
    '<type>running</type>' +
    '<name>' + activityName + '</name>' +
    '<trkseg>'

  let body = ''
  let currentTime = startTime
  let prevPoint: LatLng | null = null

  points.forEach((point, index) => {
    if (index > 0 && prevPoint) {
      if (point.routeIndex !== prevPoint.routeIndex) {
        currentTime = addSeconds(currentTime, 1)
      } else {
        const distance = haversineDistance(prevPoint, point)
        const timeMs = (distance / speedMetersSec) * 1000
        currentTime = addMilliseconds(currentTime, timeMs)
      }
    }

    const pointElevation = elevation + (Math.random() * 2 - 1)

    body +=
      '<trkpt lat="' + point.lat + '" lon="' + point.lng + '">' +
      '<ele>' + pointElevation.toFixed(1) + '</ele>' +
      '<time>' + currentTime.toISOString() + '</time>' +
      '</trkpt>'

    prevPoint = point
  })

  return header + body + '</trkseg></trk></gpx>'
}
