import { atom } from "jotai";
import type { Rhythm } from "../schemas";

export const rhythmsAtom = atom<Rhythm[]>([]);

export const activeRhythmsAtom = atom((get) =>
  get(rhythmsAtom).filter((r) => r.enabled)
);
