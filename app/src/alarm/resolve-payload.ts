import type {
  DisplayedNotification,
  InitialNotification,
  Notification,
} from "@notifee/react-native";
import type { AlarmLaunchPayload } from "../../modules/tempo-alarm";

export interface AlarmPayloadSources {
  displayedNotifications: DisplayedNotification[];
  initialNotification: InitialNotification | null;
  native: AlarmLaunchPayload;
  props: Partial<AlarmLaunchPayload>;
}

/**
 * Resolve the alarm payload from multiple sources using a priority chain:
 * props > native module > initial notification > latest displayed notification > null
 */
export function resolveAlarmPayload(
  sources: AlarmPayloadSources
): AlarmLaunchPayload {
  const { props, native, initialNotification, displayedNotifications } =
    sources;

  const initial = initialNotification?.notification;
  const latestDisplayed = pickLatestDisplayed(displayedNotifications);

  return {
    alarmInstanceId:
      props.alarmInstanceId ??
      native.alarmInstanceId ??
      (initial?.data?.alarmInstanceId as string | undefined) ??
      latestDisplayed?.id ??
      null,
    intensity:
      props.intensity ??
      native.intensity ??
      (initial?.data?.intensity as string | undefined) ??
      (latestDisplayed?.data?.intensity as string | undefined) ??
      null,
    notificationId:
      props.notificationId ??
      native.notificationId ??
      initial?.id ??
      latestDisplayed?.id ??
      null,
    rhythmId:
      props.rhythmId ??
      native.rhythmId ??
      (initial?.data?.rhythmId as string | undefined) ??
      (latestDisplayed?.data?.rhythmId as string | undefined) ??
      null,
    rhythmName:
      props.rhythmName ??
      native.rhythmName ??
      (initial?.data?.rhythmName as string | undefined) ??
      (latestDisplayed?.data?.rhythmName as string | undefined) ??
      null,
    scheduledAt:
      props.scheduledAt ??
      native.scheduledAt ??
      (initial?.data?.scheduledAt as string | undefined) ??
      (latestDisplayed?.data?.scheduledAt as string | undefined) ??
      null,
  };
}

function pickLatestDisplayed(
  entries: DisplayedNotification[]
): Notification | undefined {
  return entries
    .map((entry) => entry.notification)
    .filter(Boolean)
    .sort((left, right) => {
      const leftAt = left?.data?.scheduledAt
        ? new Date(String(left.data.scheduledAt)).getTime()
        : 0;
      const rightAt = right?.data?.scheduledAt
        ? new Date(String(right.data.scheduledAt)).getTime()
        : 0;
      return rightAt - leftAt;
    })[0];
}
