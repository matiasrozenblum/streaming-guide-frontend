import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Extend dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

// Set default timezone to Buenos Aires
const TIMEZONE = 'America/Argentina/Buenos_Aires';

export function getBuenosAiresTime() {
  return dayjs().tz(TIMEZONE);
}

export function getBuenosAiresDayOfWeek() {
  return getBuenosAiresTime().format('dddd').toLowerCase();
}

export function formatDate(date: string | Date, format: string = 'YYYY-MM-DD') {
  return dayjs(date).tz(TIMEZONE).format(format);
} 

/**
 * Returns true if the current time in Buenos Aires is strictly before the given
 * target date/time expressed in Buenos Aires timezone.
 *
 * If a string in 'YYYY-MM-DD' is provided, it is interpreted at the start of that day
 * in Buenos Aires timezone.
 */
export function isBeforeInBuenosAires(target: string | Date): boolean {
  const nowBA = getBuenosAiresTime();
  const targetBA = typeof target === 'string'
    ? dayjs.tz(target, TIMEZONE).startOf('day')
    : dayjs(target).tz(TIMEZONE);
  return nowBA.isBefore(targetBA);
}