import type { Rhythm } from "../rhythm/schemas";
import { getUpcomingBeatDates, MINUTES_PER_DAY } from "../rhythm/time-range";

const MAX_EXPANDED_ADDITIONAL = 2;

export interface StatusRhythmCandidate {
  nextBeat: Date;
  rhythm: Rhythm;
}

export interface StatusNotificationModel {
  body: string;
  lines: string[];
  primaryRhythmId: string;
  title: string;
}

export function buildStatusNotificationModel(
  candidates: StatusRhythmCandidate[],
  now = new Date()
): StatusNotificationModel | null {
  if (candidates.length === 0) {
    return null;
  }

  const primary = candidates[0];
  const primaryTimestamp = primary.nextBeat.getTime();
  const additional = candidates.slice(1, 1 + MAX_EXPANDED_ADDITIONAL);
  const visibleSameTime = additional.filter(
    (candidate) => candidate.nextBeat.getTime() === primaryTimestamp
  );
  const visibleLater = additional.filter(
    (candidate) => candidate.nextBeat.getTime() !== primaryTimestamp
  );
  const hiddenSameTimeCount = Math.max(
    candidates.filter(
      (candidate) => candidate.nextBeat.getTime() === primaryTimestamp
    ).length -
      1 -
      visibleSameTime.length,
    0
  );
  const hiddenLaterCount = Math.max(
    candidates.length - 1 - additional.length - hiddenSameTimeCount,
    0
  );

  const lines = [
    `Next in ${formatRelativeTime(primary.nextBeat, now)} - ${formatUpcomingLabel(primary.nextBeat, now)}`,
  ];
  const sameTimeLines = visibleSameTime.map(
    (candidate) =>
      `${candidate.rhythm.name}: next ${formatUpcomingLabel(candidate.nextBeat, now)}`
  );
  const laterLines = visibleLater.map(
    (candidate) =>
      `${candidate.rhythm.name}: next ${formatUpcomingLabel(candidate.nextBeat, now)}`
  );

  if (sameTimeLines.length > 0 || hiddenSameTimeCount > 0) {
    lines.push("Also going off at the same time");
    lines.push(...sameTimeLines);
    if (hiddenSameTimeCount > 0) {
      lines.push(`+ ${hiddenSameTimeCount} going off at the same time`);
    }
  }

  if (laterLines.length > 0 || hiddenLaterCount > 0) {
    lines.push("Others");
    lines.push(...laterLines);
    if (hiddenLaterCount > 0) {
      lines.push(
        `+ ${hiddenLaterCount} ${hiddenLaterCount === 1 ? "other" : "others"}`
      );
    }
  }

  return {
    body: lines[0],
    lines,
    primaryRhythmId: primary.rhythm.id,
    title: primary.rhythm.name,
  };
}

export function getStatusRhythmCandidates(
  rhythms: Rhythm[],
  now = new Date()
): StatusRhythmCandidate[] {
  return rhythms
    .filter((rhythm) => rhythm.enabled)
    .map((rhythm) => ({
      rhythm,
      nextBeat: getUpcomingBeatDates(rhythm, 1, now)[0] ?? null,
    }))
    .filter(
      (candidate): candidate is StatusRhythmCandidate =>
        candidate.nextBeat !== null
    )
    .sort((left, right) => {
      const byTimestamp = left.nextBeat.getTime() - right.nextBeat.getTime();
      if (byTimestamp !== 0) {
        return byTimestamp;
      }

      return left.rhythm.sortOrder - right.rhythm.sortOrder;
    });
}

function formatClock(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatUpcomingLabel(target: Date, now: Date): string {
  if (isSameDay(target, now)) {
    return formatClock(target);
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (isSameDay(target, tomorrow)) {
    return "Tomorrow";
  }

  return target.toLocaleDateString("en-US", { weekday: "long" });
}

function formatRelativeTime(target: Date, now: Date): string {
  const diffMinutes = Math.max(
    Math.ceil((target.getTime() - now.getTime()) / 60_000),
    0
  );

  if (diffMinutes === 0) {
    return "now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min`;
  }

  if (diffMinutes > MINUTES_PER_DAY) {
    const days = Math.max(1, getCalendarDayDiff(now, target));
    return `${days} day${days === 1 ? "" : "s"}`;
  }

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
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
