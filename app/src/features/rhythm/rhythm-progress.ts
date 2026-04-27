import type { Rhythm } from "./schemas";
import { getRelevantWindowBeats, getUpcomingBeatDates } from "./time-range";

export interface RhythmProgress {
  allDoneForToday: boolean;
  currentProgress: number;
  done: number;
  nextBeat: string | null;
  total: number;
}

/**
 * Compute how far through today's beat cycle a rhythm is,
 * including the next upcoming beat time (same-day only).
 */
export function computeRhythmProgress(
  rhythm: Rhythm,
  now = new Date()
): RhythmProgress {
  const beats = getRelevantWindowBeats(rhythm, now);
  const total = beats.length;

  if (total === 0) {
    return {
      allDoneForToday: false,
      currentProgress: 0,
      done: 0,
      nextBeat: formatNextSameDayBeat(rhythm, now),
      total: 0,
    };
  }

  const done = beats.filter((beat) => beat.getTime() <= now.getTime()).length;

  if (done === 0) {
    return {
      allDoneForToday: false,
      currentProgress: 0,
      done: 0,
      nextBeat: formatNextSameDayBeat(rhythm, now),
      total,
    };
  }

  const allDoneForToday = done >= total;
  const lastBeatAt = beats[Math.min(done - 1, beats.length - 1)];
  const elapsedMinutes = (now.getTime() - lastBeatAt.getTime()) / 60_000;

  const currentProgress = allDoneForToday
    ? 1
    : Math.min(elapsedMinutes / rhythm.intervalMinutes, 1);

  return {
    allDoneForToday,
    currentProgress,
    done: Math.min(done, total),
    nextBeat: allDoneForToday ? null : formatNextSameDayBeat(rhythm, now),
    total,
  };
}

function formatNextSameDayBeat(rhythm: Rhythm, now: Date): string | null {
  const nextBeat = getUpcomingBeatDates(rhythm, 1, now)[0];
  if (!nextBeat) {
    return null;
  }

  const isSameDay =
    nextBeat.getFullYear() === now.getFullYear() &&
    nextBeat.getMonth() === now.getMonth() &&
    nextBeat.getDate() === now.getDate();

  if (!isSameDay) {
    return null;
  }

  return `${String(nextBeat.getHours()).padStart(2, "0")}:${String(nextBeat.getMinutes()).padStart(2, "0")}`;
}
