import type { Rhythm } from "./schemas";
import { getUpcomingBeatDates, MINUTES_PER_DAY } from "./time-range";

export function formatNextBeat(
  activeRhythms: Rhythm[],
  now = new Date()
): string {
  if (activeRhythms.length === 0) {
    return "--:--";
  }

  let soonestBeat: Date | null = null;

  for (const rhythm of activeRhythms) {
    const nextBeat = getUpcomingBeatDates(rhythm, 1, now)[0];
    if (!nextBeat) {
      continue;
    }

    if (!soonestBeat || nextBeat.getTime() < soonestBeat.getTime()) {
      soonestBeat = nextBeat;
    }
  }

  if (!soonestBeat) {
    return "--:--";
  }

  const diffMinutes = Math.ceil(
    (soonestBeat.getTime() - now.getTime()) / 60_000
  );

  if (diffMinutes > MINUTES_PER_DAY) {
    const days = Math.max(1, getCalendarDayDiff(now, soonestBeat));
    return `IN ${days} DAY${days === 1 ? "" : "S"}`;
  }

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function getCalendarDayDiff(from: Date, to: Date): number {
  const fromStart = new Date(from);
  fromStart.setHours(0, 0, 0, 0);

  const toStart = new Date(to);
  toStart.setHours(0, 0, 0, 0);

  return Math.round(
    (toStart.getTime() - fromStart.getTime()) / (24 * 60 * 60 * 1000)
  );
}
