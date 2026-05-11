import { atom } from "jotai";
import type { Rhythm } from "../schemas";

export const rhythmsAtom = atom<Rhythm[]>([]);
