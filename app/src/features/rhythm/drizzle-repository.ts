import { db } from "@/lib/db";
import { rhythm as rhythmLog } from "@/lib/logger";
import { rhythms } from "@/lib/schema";
import {
  createRhythm,
  deleteRhythm,
  getAllRhythms,
  getRhythm,
  reorderRhythms,
  toggleRhythm,
  updateRhythm,
} from "./operations";
import type { RhythmRepository } from "./repository";

export function createDrizzleRepository(): RhythmRepository {
  return {
    getAll: getAllRhythms,
    get: getRhythm,
    create: createRhythm,
    update: updateRhythm,
    toggle: toggleRhythm,
    delete: deleteRhythm,
    deleteAll() {
      db.delete(rhythms).run();
      rhythmLog.info("delete", { rhythmId: "*" });
    },
    reorder: reorderRhythms,
  };
}
