import { fromZonedTime, toZonedTime } from 'date-fns-tz'
import { format } from 'date-fns'

export const TIMEZONE = 'Asia/Ho_Chi_Minh'

export function getDefaultStartTimeValue(now: Date = new Date()): string {
  return format(toZonedTime(now, TIMEZONE), "yyyy-MM-dd'T'HH:mm")
}

// Treat the datetime-local string as wall-clock time in TIMEZONE
// and convert it back to a real Date (UTC instant).
export function parseStartTimeInput(value: string): Date {
  if (!value) return new Date()
  return fromZonedTime(value, TIMEZONE)
}
