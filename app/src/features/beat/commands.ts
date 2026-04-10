import { beat } from "@/lib/logger";
import { getRhythm, toggleRhythm } from "../rhythm/operations";
import { cancelRhythm } from "./engine";
import { syncStatusNotification } from "./status";

export async function disableRhythmFromStatusNotification(
  rhythmId: string | undefined,
  source: string
): Promise<void> {
  if (!rhythmId) {
    beat.warn("schedule_skipped", { source, detail: "missing-rhythm-id" });
    await syncStatusNotification(source);
    return;
  }

  const rhythm = getRhythm(rhythmId);
  if (!rhythm) {
    beat.warn("schedule_skipped", {
      source,
      detail: "rhythm-not-found",
      rhythmId,
    });
    await syncStatusNotification(source);
    return;
  }

  beat.info("dismissed", {
    source,
    rhythmId,
    rhythmName: rhythm.name,
    detail: "disabled-from-status",
  });
  toggleRhythm(rhythmId, false);
  await cancelRhythm(rhythmId);
  await syncStatusNotification(source);
}
