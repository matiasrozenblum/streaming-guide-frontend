import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/es';

// Extend dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

// Set default timezone to Buenos Aires
const TIMEZONE = 'America/Argentina/Buenos_Aires';

/**
 * Date/Time Utility Functions
 * Centralized utilities for date and time formatting across the application
 */

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
 * Format time string to HH:mm (24-hour format)
 * @param time - Time string in HH:mm format
 * @returns Formatted time string
 */
export function formatTime(time: string): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
}

/**
 * Format time range for display
 * @param startTime - Start time in HH:mm format
 * @param endTime - End time in HH:mm format
 * @returns Formatted time range (e.g., "14:00-16:30")
 */
export function formatTimeRange(startTime: string, endTime: string): string {
  return `${formatTime(startTime)}-${formatTime(endTime)}`;
}

/**
 * Format date for display (DD/MM/YYYY)
 * @param date - Date string or Dayjs object
 * @returns Formatted date string
 */
export function formatDateDisplay(date: string | Dayjs): string {
  if (!date) return '';
  return dayjs(date).format('DD/MM/YYYY');
}

/**
 * Convert date to backend format (YYYY-MM-DD)
 * @param date - Dayjs object
 * @returns Date string in YYYY-MM-DD format
 */
export function dateToBackendFormat(date: Dayjs | null): string {
  if (!date) return '';
  return date.format('YYYY-MM-DD');
}

/**
 * Convert backend date string to Dayjs object
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Dayjs object or null
 */
export function dateFromBackendFormat(dateString: string): Dayjs | null {
  if (!dateString) return null;
  return dayjs(dateString);
}

/**
 * Validate if a time string is in valid HH:mm format
 * @param time - Time string to validate
 * @returns true if valid, false otherwise
 */
export function isValidTimeFormat(time: string): boolean {
  if (!time) return false;
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

/**
 * Compare two times
 * @param time1 - First time in HH:mm format
 * @param time2 - Second time in HH:mm format
 * @returns true if time1 < time2
 */
export function isTimeBefore(time1: string, time2: string): boolean {
  if (!time1 || !time2) return false;
  const [h1, m1] = time1.split(':').map(Number);
  const [h2, m2] = time2.split(':').map(Number);
  return h1 * 60 + m1 < h2 * 60 + m2;
}

/**
 * Validate if a date range is valid (start <= end)
 * @param startDate - Start date
 * @param endDate - End date
 * @returns true if valid, false otherwise
 */
export function isValidDateRange(startDate: Dayjs | null, endDate: Dayjs | null): boolean {
  if (!startDate || !endDate) return true; // Allow empty dates
  return !endDate.isBefore(startDate);
}

/**
 * Validate if a time range is valid (start < end)
 * @param startTime - Start time in HH:mm format
 * @param endTime - End time in HH:mm format
 * @returns true if valid, false otherwise
 */
export function isValidTimeRange(startTime: string, endTime: string): boolean {
  if (!startTime || !endTime) return true; // Allow empty times
  return isTimeBefore(startTime, endTime);
} 