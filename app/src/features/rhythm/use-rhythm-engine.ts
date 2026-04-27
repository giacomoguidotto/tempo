import { useAtom } from "jotai";
import { type ReactNode, useEffect } from "react";
import { useConfirmDialog } from "@/components/ui/use-confirm-dialog";
import { cancelRhythm, scheduleRhythm } from "@/features/beat/engine";
import { requestAlarmPermissions } from "@/features/beat/permissions";
import { syncStatusNotification } from "@/features/beat/status";
import {
  deleteRhythm,
  getAllRhythms,
  reorderRhythms,
  toggleRhythm,
} from "./operations";
import type { Rhythm } from "./schemas";
import { rhythmsAtom } from "./store/atoms";

interface RhythmEngine {
  handleDelete: (id: string) => Promise<void>;
  handleReorder: (reordered: Rhythm[]) => void;
  handleToggle: (id: string, enabled: boolean) => Promise<void>;
  permissionDialog: ReactNode;
  rhythms: Rhythm[];
}

export function useRhythmEngine(): RhythmEngine {
  const [rhythms, setRhythms] = useAtom(rhythmsAtom);
  const { confirm: presentPermissionPrompt, dialog: permissionDialog } =
    useConfirmDialog();

  // Hydrate on mount: load from DB, schedule enabled rhythms, sync status
  useEffect(() => {
    async function hydrate() {
      const loaded = getAllRhythms();
      setRhythms(loaded);

      for (const rhythm of loaded.filter((candidate) => candidate.enabled)) {
        await scheduleRhythm(rhythm, "tabs-mount");
      }

      await syncStatusNotification("tabs-mount");
    }

    hydrate().catch(() => {
      syncStatusNotification("tabs-mount-fallback").catch(() => undefined);
    });
  }, [setRhythms]);

  async function handleToggle(id: string, enabled: boolean) {
    const currentRhythm = rhythms.find((r) => r.id === id);

    if (enabled) {
      const granted = await requestAlarmPermissions({
        presentPrompt: presentPermissionPrompt,
        requireFullScreen:
          currentRhythm?.intensity === "pulse" ||
          currentRhythm?.intensity === "call",
      });
      if (!granted) {
        return;
      }
    }

    toggleRhythm(id, enabled);
    const updated = rhythms.map((r) =>
      r.id === id ? { ...r, enabled, updatedAt: new Date().toISOString() } : r
    );
    setRhythms(updated);

    const rhythm = updated.find((r) => r.id === id);
    if (rhythm) {
      scheduleRhythm(rhythm);
    }
  }

  async function handleDelete(id: string) {
    await cancelRhythm(id);
    deleteRhythm(id);
    setRhythms(getAllRhythms());
    await syncStatusNotification("tabs-delete");
  }

  function handleReorder(reordered: Rhythm[]) {
    setRhythms(reordered);
    reorderRhythms(reordered.map((r) => r.id));
    syncStatusNotification("tabs-reorder").catch(() => undefined);
  }

  return {
    handleDelete,
    handleReorder,
    handleToggle,
    permissionDialog,
    rhythms,
  };
}
