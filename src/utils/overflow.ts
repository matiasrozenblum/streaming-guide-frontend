import { OVERFLOW_MINUTES } from '@/constants/layout';

/** Minimal shape needed to place a schedule in the overflow zone. */
interface OverflowSchedule {
  day_of_week: string;
  start_time: string;
  end_time: string;
  program: {
    id: number;
    channel: { id: number };
  };
}

const toMinutes = (timeStr: string) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

/** True when the block occupies the midnight boundary: it ends at 23:59 or wraps past 00:00. */
const holdsMidnight = (s: OverflowSchedule) => {
  const start = toMinutes(s.start_time);
  const end = toMinutes(s.end_time);
  return end <= start || end >= 23 * 60 + 59;
};

/**
 * Schedules of `nextDay` that belong in the current day's 00:00–04:00 overflow zone.
 *
 * Programs starting at 00:00 are included: they air inside the window the overflow
 * represents, so the previous day's view must show them (a show at 00:00 or 02:00
 * appears both on its own day and in the previous day's overflow).
 *
 * The exclusion is the program that already holds the midnight boundary on the current
 * day, which is what would render as a literal duplicate:
 *  - 24/7 blocks (00:00–23:59) would repeat their own title in the overflow right after
 *    themselves;
 *  - a cross-midnight airing served as two rows (day X 22:30–23:59 + day X+1 00:00–00:00)
 *    would show the same title twice back to back. The backend also serves that same
 *    airing as a single 22:30–00:00 row depending on which response variant is hit, and
 *    ScheduleRow already stretches that form into the overflow on its own.
 */
export function getOverflowSchedules<T extends OverflowSchedule>(
  overflowSource: T[],
  schedulesForDay: T[],
  nextDay: string,
): T[] {
  return overflowSource.filter(s => {
    if (s.day_of_week !== nextDay) return false;

    const startMin = toMinutes(s.start_time);
    if (startMin >= OVERFLOW_MINUTES) return false;
    if (startMin > 0) return true;

    return !schedulesForDay.some(
      cur =>
        cur.program.channel.id === s.program.channel.id &&
        cur.program.id === s.program.id &&
        holdsMidnight(cur),
    );
  });
}
