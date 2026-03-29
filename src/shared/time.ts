import { toZonedTime } from 'date-fns-tz'
import { format, parseISO } from 'date-fns'

export const TIMEZONE = 'Asia/Ho_Chi_Minh'

export function getDefaultStartTimeValue(now: Date = new Date()): string {
  return format(toZonedTime(now, TIMEZONE), "yyyy-MM-dd'T'HH:mm")
}

export function parseStartTimeInput(value: string): Date {
  if (!value) return toZonedTime(new Date(), TIMEZONE)
  return toZonedTime(parseISO(value), TIMEZONE)
}
