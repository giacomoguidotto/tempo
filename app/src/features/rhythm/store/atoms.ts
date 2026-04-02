import { atom } from "jotai";
import { getAllRhythms } from "../operations";
import type { Rhythm } from "../schemas";

export const rhythmsAtom = atom<Rhythm[]>(getAllRhythms());

export const activeRhythmsAtom = atom((get) =>
  get(rhythmsAtom).filter((r) => r.enabled)
);
