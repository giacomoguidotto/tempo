import type { Rhythm } from "@/features/rhythm/schemas";

export interface AlarmPayload {
  alarmInstanceId: string | null;
  intensity: string | null;
  notificationId: string | null;
  rhythmId: string | null;
  rhythmName: string | null;
  scheduledAt: string | null;
}

export interface AlarmScheduler {
  cancel(rhythmId: string): Promise<void>;
  cancelAll(): Promise<void>;
  dismiss(notificationId: string): Promise<void>;
  resolveInitialAlarm(): Promise<AlarmPayload | null>;
  schedule(rhythm: Rhythm): Promise<void>;
  scheduleAll(rhythms: Rhythm[]): Promise<void>;
}
