import { getRhythm, toggleRhythm } from "../rhythm/operations";
import { cancelRhythm } from "./engine";
import { syncStatusNotification } from "./status";

export async function disableRhythmFromStatusNotification(
  rhythmId: string | undefined,
  source: string
): Promise<void> {
  if (!rhythmId) {
    await syncStatusNotification(source);
    return;
  }

  const rhythm = getRhythm(rhythmId);
  if (!rhythm) {
    await syncStatusNotification(source);
    return;
  }

  toggleRhythm(rhythmId, false);
  await cancelRhythm(rhythmId);
  await syncStatusNotification(source);
}
