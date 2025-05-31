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