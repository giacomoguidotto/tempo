import { useAtom } from "jotai";
import { type ReactNode, useEffect } from "react";
import { useConfirmDialog } from "@/components/ui/use-confirm-dialog";
import { requestAlarmPermissions } from "@/features/beat/permissions";
import { rhythmStore } from "@/store/rhythm";
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
  const [rhythms] = useAtom(rhythmsAtom);
  const { confirm: presentPermissionPrompt, dialog: permissionDialog } =
    useConfirmDialog();

  useEffect(() => {
    rhythmStore.hydrate().catch(() => undefined);
  }, []);

  async function handleToggle(id: string, enabled: boolean) {
    if (enabled) {
      const currentRhythm = rhythms.find((r) => r.id === id);
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

    await rhythmStore.toggle(id, enabled);
  }

  async function handleDelete(id: string) {
    await rhythmStore.delete(id);
  }

  function handleReorder(reordered: Rhythm[]) {
    rhythmStore.reorder(reordered);
  }

  return {
    handleDelete,
    handleReorder,
    handleToggle,
    permissionDialog,
    rhythms,
  };
}
