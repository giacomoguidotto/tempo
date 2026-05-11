import type { CreateRhythm, Rhythm } from "./schemas";

export interface RhythmRepository {
  create(input: CreateRhythm): Rhythm;
  delete(id: string): void;
  deleteAll(): void;
  get(id: string): Rhythm | undefined;
  getAll(): Rhythm[];
  reorder(orderedIds: string[]): void;
  toggle(id: string, enabled: boolean): void;
  update(id: string, input: Partial<CreateRhythm>): Rhythm | undefined;
}
