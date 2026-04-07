import { requireNativeModule } from "expo";

export interface AlarmLaunchPayload {
  alarmInstanceId: string | null;
  intensity: string | null;
  notificationId: string | null;
  rhythmId: string | null;
  rhythmName: string | null;
  scheduledAt: string | null;
}

declare class TempoAlarmModule {
  canUseFullScreenIntent(): Promise<boolean>;
  clearActiveAlarmInstance(alarmInstanceId?: string | null): Promise<void>;
  finishAlarmActivity(): Promise<void>;
  getActiveAlarmInstanceId(): string | null;
  getInitialAlarmPayload(): AlarmLaunchPayload;
  openFullScreenIntentSettings(): Promise<void>;
  openMainApp(): Promise<void>;
}

export default requireNativeModule<TempoAlarmModule>("TempoAlarm");
