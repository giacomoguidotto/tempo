import notifee, { AndroidStyle } from "@notifee/react-native";
import { beat } from "@/lib/logger";
import { getAllRhythms } from "../rhythm/operations";
import type { Rhythm } from "../rhythm/schemas";
import { getUpcomingBeatDates, MINUTES_PER_DAY } from "../rhythm/time-range";
import { CHANNEL_IDS } from "./channels";

const STATUS_NOTIFICATION_ID = "tempo-status";
const STATUS_DISABLE_ACTION_ID = "status-disable";
const STATUS_NOTIFICATION_KIND = "status";
const MAX_EXPANDED_ADDITIONAL = 2;

/** Self-scheduling refresh: keeps the "Next in X min" countdown fresh. */
let refreshTimerId: ReturnType<typeof setTimeout> | null = null;

function scheduleRefresh() {
  if (refreshTimerId) {
    clearTimeout(refreshTimerId);
    refreshTimerId = null;
  }
  const msToNextMinute =
    (60 - new Date().getSeconds()) * 1000 - new Date().getMilliseconds() + 500;
  refreshTimerId = setTimeout(() => {
    refreshTimerId = null;
    syncStatusNotification("refresh").catch(() => undefined);
  }, msToNextMinute);
}

function cancelRefresh() {
  if (refreshTimerId) {
    clearTimeout(refreshTimerId);
    refreshTimerId = null;
  }
}

interface StatusRhythmCandidate {
  nextBeat: Date;
  rhythm: Rhythm;
}

interface StatusNotificationModel {
  body: string;
  lines: string[];
  primaryRhythmId: string;
  title: string;
}

export function getStatusNotificationActionId(): string {
  return STATUS_DISABLE_ACTION_ID;
}

export function isStatusNotification(
  notification: { data?: Record<string, unknown> } | undefined
): boolean {
  return notification?.data?.notificationKind === STATUS_NOTIFICATION_KIND;
}

export async function syncStatusNotification(source = "manual"): Promise<void> {
  const model = buildStatusNotificationModel(getStatusRhythmCandidates());

  if (!model) {
    beat.info("status_cancel", { source });
    cancelRefresh();
    await notifee.cancelNotification(STATUS_NOTIFICATION_ID);
    return;
  }

  await notifee.displayNotification({
    id: STATUS_NOTIFICATION_ID,
    title: model.title,
    body: model.body,
    android: {
      channelId: CHANNEL_IDS.status,
      smallIcon: "ic_launcher",
      pressAction: { id: "default" },
      actions: [
        {
          title: "Disable",
          pressAction: { id: STATUS_DISABLE_ACTION_ID },
        },
      ],
      autoCancel: false,
      ongoing: true,
      onlyAlertOnce: true,
      style: {
        type: AndroidStyle.INBOX,
        lines: model.lines,
      },
    },
    data: {
      notificationKind: STATUS_NOTIFICATION_KIND,
      primaryRhythmId: model.primaryRhythmId,
      source,
    },
  });

  beat.info("status_sync", {
    source,
    rhythmCount: getStatusRhythmCandidates().length,
  });
  scheduleRefresh();
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

function getStatusRhythmCandidates(now = new Date()): StatusRhythmCandidate[] {
  return getAllRhythms()
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
