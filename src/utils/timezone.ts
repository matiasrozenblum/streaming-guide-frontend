import { DAY_ORDER, DayOfWeek } from '@/constants/layout';

// ART = America/Argentina/Buenos_Aires = UTC-3, no DST
export const ART_UTC_OFFSET_MINUTES = -180;

/** Local UTC offset in minutes (e.g. UTC+2 → 120, UTC-5 → -300). */
function getLocalUTCOffsetMinutes(): number {
  return -new Date().getTimezoneOffset();
}

/** How many minutes ahead (+) or behind (-) the user is from ART. */
export function getLocalToARTOffsetMinutes(): number {
  return getLocalUTCOffsetMinutes() - ART_UTC_OFFSET_MINUTES;
}

/** True when the user's device is already in the Argentina timezone. */
export function isArgentinaTz(): boolean {
  return getLocalToARTOffsetMinutes() === 0;
}

function shiftDay(day: string, shift: number): string {
  const idx = DAY_ORDER.indexOf(day as DayOfWeek);
  if (idx === -1) return day;
  return DAY_ORDER[((idx + shift) % 7 + 7) % 7];
}

function addMinutesToTimeStr(
  timeStr: string,
  offsetMinutes: number,
): { time: string; dayShift: number } {
  const [h, m] = timeStr.split(':').map(Number);
  let total = h * 60 + m + offsetMinutes;
  let dayShift = 0;

  while (total >= 24 * 60) { total -= 24 * 60; dayShift += 1; }
  while (total < 0)         { total += 24 * 60; dayShift -= 1; }

  const newH = Math.floor(total / 60);
  const newM = total % 60;
  return {
    time: `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`,
    dayShift,
  };
}

/**
 * Convert a schedule's start_time / end_time / day_of_week from ART to the
 * user's local timezone by applying offsetMinutes (= getLocalToARTOffsetMinutes()).
 * Returns the original object unchanged when offsetMinutes is 0.
 */
export function localizeSchedule<
  T extends { start_time: string; end_time: string; day_of_week: string },
>(schedule: T, offsetMinutes: number): T {
  if (offsetMinutes === 0) return schedule;

  const { time: localStart, dayShift } = addMinutesToTimeStr(schedule.start_time, offsetMinutes);
  const { time: localEnd } = addMinutesToTimeStr(schedule.end_time, offsetMinutes);

  return {
    ...schedule,
    start_time: localStart,
    end_time: localEnd,
    day_of_week: shiftDay(schedule.day_of_week, dayShift),
  };
}

/**
 * Given the current local time, return the equivalent minutes-from-midnight in
 * the ART timezone. Used to position the NowIndicator and scroll-to-now when
 * the grid is showing ART (unconverted) schedules.
 */
export function getARTMinutesFromMidnight(): number {
  const now = new Date();
  const localMin = now.getHours() * 60 + now.getMinutes();
  const offset = getLocalToARTOffsetMinutes();
  return ((localMin - offset) % (24 * 60) + 24 * 60) % (24 * 60);
}
