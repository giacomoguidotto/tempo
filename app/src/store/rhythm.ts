import { getDefaultStore } from "jotai";
import { alarmScheduler, statusNotifier } from "@/features/beat";
import { rhythmRepository } from "@/features/rhythm";
import type { CreateRhythm, Rhythm } from "@/features/rhythm/schemas";
import { rhythmsAtom } from "@/features/rhythm/store/atoms";

const store = getDefaultStore();

function setRhythms(rhythms: Rhythm[]) {
  store.set(rhythmsAtom, rhythms);
}

export const rhythmStore = {
  hydrate: async () => {
    const loaded = rhythmRepository.getAll();
    setRhythms(loaded);

    for (const rhythm of loaded.filter((r) => r.enabled)) {
      await alarmScheduler.schedule(rhythm);
    }

    await statusNotifier.sync("store-hydrate");
  },

  create: async (input: CreateRhythm) => {
    const rhythm = rhythmRepository.create(input);
    setRhythms(rhythmRepository.getAll());
    await alarmScheduler.schedule(rhythm);
    await statusNotifier.sync("store-create");
    return rhythm;
  },

  update: async (id: string, input: Partial<CreateRhythm>) => {
    const rhythm = rhythmRepository.update(id, input);
    if (!rhythm) {
      return;
    }
    setRhythms(rhythmRepository.getAll());
    await alarmScheduler.schedule(rhythm);
    await statusNotifier.sync("store-update");
    return rhythm;
  },

  toggle: async (id: string, enabled: boolean) => {
    rhythmRepository.toggle(id, enabled);
    const rhythms = rhythmRepository.getAll();
    setRhythms(rhythms);

    const rhythm = rhythms.find((r) => r.id === id);
    if (rhythm) {
      await alarmScheduler.schedule(rhythm);
    }
    await statusNotifier.sync("store-toggle");
  },

  delete: async (id: string) => {
    await alarmScheduler.cancel(id);
    rhythmRepository.delete(id);
    setRhythms(rhythmRepository.getAll());
    await statusNotifier.sync("store-delete");
  },

  deleteAll: async () => {
    await alarmScheduler.cancelAll();
    rhythmRepository.deleteAll();
    setRhythms([]);
    await statusNotifier.sync("store-delete-all");
  },

  reorder: (rhythms: Rhythm[]) => {
    setRhythms(rhythms);
    rhythmRepository.reorder(rhythms.map((r) => r.id));
    statusNotifier.sync("store-reorder").catch(() => undefined);
  },
};
