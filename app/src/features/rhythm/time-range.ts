import type { Rhythm } from "./schemas";

export const MINUTES_PER_DAY = 24 * 60;
const UPCOMING_LOOKAHEAD_DAYS = 42;

type RhythmScheduleShape = Pick<
  Rhythm,
  "days" | "endTime" | "intervalMinutes" | "startTime"
>;

export interface RhythmWindow {
  end: Date;
  start: Date;
  startDay: Date;
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number): string {
  const normalized =
    ((Math.round(totalMinutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) %
    MINUTES_PER_DAY;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function crossesMidnight(startTime: string, endTime: string): boolean {
  return timeToMinutes(startTime) > timeToMinutes(endTime);
}

export function getRhythmWindowForStartDay(
  startDay: Date,
  startTime: string,
  endTime: string
): RhythmWindow {
  const start = startOfDay(startDay);
  start.setMinutes(timeToMinutes(startTime));

  const end = startOfDay(startDay);
  if (crossesMidnight(startTime, endTime)) {
    end.setDate(end.getDate() + 1);
  }
  end.setMinutes(timeToMinutes(endTime));

  return { startDay: startOfDay(startDay), start, end };
}

export function getBeatsForWindow(
  window: RhythmWindow,
  intervalMinutes: number
): Date[] {
  const beats: Date[] = [];
  const intervalMs = intervalMinutes * 60 * 1000;

  for (
    let timestamp = window.start.getTime();
    timestamp <= window.end.getTime();
    timestamp += intervalMs
  ) {
    beats.push(new Date(timestamp));
  }

  return beats;
}

export function getUpcomingBeatDates(
  rhythm: RhythmScheduleShape,
  count = 1,
  now = new Date()
): Date[] {
  const beats: Date[] = [];
  const today = startOfDay(now);

  for (
    let dayOffset = -1;
    dayOffset < UPCOMING_LOOKAHEAD_DAYS && beats.length < count;
    dayOffset++
  ) {
    const startDay = new Date(today);
    startDay.setDate(today.getDate() + dayOffset);

    if (!rhythm.days.includes(startDay.getDay())) {
      continue;
    }

    const window = getRhythmWindowForStartDay(
      startDay,
      rhythm.startTime,
      rhythm.endTime
    );

    for (const beat of getBeatsForWindow(window, rhythm.intervalMinutes)) {
      if (beat.getTime() > now.getTime()) {
        beats.push(beat);
      }

      if (beats.length >= count) {
        break;
      }
    }
  }

  return beats;
}

export function getActiveWindowForNow(
  rhythm: RhythmScheduleShape,
  now = new Date()
): RhythmWindow | null {
  const today = startOfDay(now);

  for (const dayOffset of [-1, 0]) {
    const startDay = new Date(today);
    startDay.setDate(today.getDate() + dayOffset);

    if (!rhythm.days.includes(startDay.getDay())) {
      continue;
    }

    const window = getRhythmWindowForStartDay(
      startDay,
      rhythm.startTime,
      rhythm.endTime
    );

    if (
      window.start.getTime() <= now.getTime() &&
      now.getTime() <= window.end.getTime()
    ) {
      return window;
    }
  }

  return null;
}

export function getRelevantWindowBeats(
  rhythm: RhythmScheduleShape,
  now = new Date()
): Date[] {
  const activeWindow = getActiveWindowForNow(rhythm, now);
  if (activeWindow) {
    return getBeatsForWindow(activeWindow, rhythm.intervalMinutes);
  }

  const today = startOfDay(now);
  if (!rhythm.days.includes(today.getDay())) {
    return [];
  }

  return getBeatsForWindow(
    getRhythmWindowForStartDay(today, rhythm.startTime, rhythm.endTime),
    rhythm.intervalMinutes
  );
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}
