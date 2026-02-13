/**
 * @file Program configuration store (Zustand + persist).
 *
 * Business context:
 * - The app uses a fixed 7-day workout program split (e.g. PULL/PUSH/LEGS/REST/PULL/PUSH/LEGS).
 * - Each day has ordered "slots" — each slot targets a muscle group and can have an exercise assigned.
 * - Users configure the program via ProgramPage: add/remove/reorder slots, assign/unassign exercises.
 * - The program structure drives what appears on the WorkoutPage for daily logging.
 *
 * Default program:
 *   D1 PULL: Back, Back, Biceps, Rear Delts, ABS
 *   D2 PUSH: Chest, Shoulders, Chest, Shoulders, Triceps
 *   D3 LEGS: Legs, Hamstring, Legs, Calves
 *   D4 REST: (no slots)
 *   D5 PULL: Legs, Back, Back, Biceps, Traps, ABS
 *   D6 PUSH: Chest, Shoulders, Chest, Shoulders, Triceps
 *   D7 LEGS: Legs, Hamstring, Quads, Calves
 *
 * Persistence: full program saved to localStorage (key: "gymapp-program").
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { fallbackStorage } from '@/utils/storage';
import type { ProgramDay, WorkoutSlot, MuscleGroup } from '@/types';
import { generateId } from '@/utils/ids';

const DEFAULT_PROGRAM_BLUEPRINT: Record<number, Array<{ muscleGroup: MuscleGroup; exerciseId: string }>> = {
  1: [
    { muscleGroup: 'back', exerciseId: 'seed-back-1' },
    { muscleGroup: 'back', exerciseId: 'seed-back-2' },
    { muscleGroup: 'biceps', exerciseId: 'seed-biceps-1' },
    { muscleGroup: 'rear_delts', exerciseId: 'seed-rear-delts-1' },
    { muscleGroup: 'abs', exerciseId: 'seed-abs-1' },
  ],
  2: [
    { muscleGroup: 'chest', exerciseId: 'seed-chest-1' },
    { muscleGroup: 'shoulders', exerciseId: 'seed-shoulders-2' },
    { muscleGroup: 'chest', exerciseId: 'seed-chest-2' },
    { muscleGroup: 'shoulders', exerciseId: 'seed-shoulders-1' },
    { muscleGroup: 'triceps', exerciseId: 'seed-triceps-1' },
  ],
  3: [
    { muscleGroup: 'legs', exerciseId: 'seed-legs-1' },
    { muscleGroup: 'hamstring', exerciseId: 'seed-hamstring-1' },
    { muscleGroup: 'legs', exerciseId: 'seed-legs-2' },
    { muscleGroup: 'calves', exerciseId: 'seed-calves-1' },
  ],
  4: [],
  5: [
    { muscleGroup: 'legs', exerciseId: 'seed-legs-3' },
    { muscleGroup: 'back', exerciseId: 'seed-back-1' },
    { muscleGroup: 'back', exerciseId: 'seed-back-3' },
    { muscleGroup: 'biceps', exerciseId: 'seed-biceps-2' },
    { muscleGroup: 'traps', exerciseId: 'seed-traps-1' },
    { muscleGroup: 'abs', exerciseId: 'seed-abs-1' },
  ],
  6: [
    { muscleGroup: 'chest', exerciseId: 'seed-chest-1' },
    { muscleGroup: 'shoulders', exerciseId: 'seed-shoulders-3' },
    { muscleGroup: 'chest', exerciseId: 'seed-chest-3' },
    { muscleGroup: 'shoulders', exerciseId: 'seed-shoulders-1' },
    { muscleGroup: 'triceps', exerciseId: 'seed-triceps-2' },
  ],
  7: [
    { muscleGroup: 'legs', exerciseId: 'seed-legs-1' },
    { muscleGroup: 'hamstring', exerciseId: 'seed-hamstring-2' },
    { muscleGroup: 'quads', exerciseId: 'seed-quads-1' },
    { muscleGroup: 'calves', exerciseId: 'seed-calves-1' },
  ],
};

/**
 * Fill missing slot exercise assignments for legacy persisted programs.
 * Keeps custom structure untouched; only backfills null exerciseId when index+muscleGroup match blueprint.
 */
const backfillDefaultAssignments = (days: ProgramDay[]): ProgramDay[] =>
  days.map((day) => {
    const blueprint = DEFAULT_PROGRAM_BLUEPRINT[day.dayNumber];
    if (!blueprint || blueprint.length === 0) return day;

    const nextSlots = day.slots.map((slot, index) => {
      if (slot.exerciseId) return slot;
      const defaultSlot = blueprint[index];
      if (!defaultSlot) return slot;
      if (slot.muscleGroup !== defaultSlot.muscleGroup) return slot;
      return { ...slot, exerciseId: defaultSlot.exerciseId };
    });

    return { ...day, slots: nextSlots };
  });

/** Generate the default 7-day program with predefined muscle group slots */
const createDefaultProgram = (): ProgramDay[] => {
  /** Helper to create a slot with pre-bound exercise identity */
  const slot = (mg: MuscleGroup, exerciseId: string): WorkoutSlot => ({ id: generateId(), muscleGroup: mg, exerciseId });

  return [
    {
      dayNumber: 1,
      label: 'PULL',
      slots: DEFAULT_PROGRAM_BLUEPRINT[1].map((s) => slot(s.muscleGroup, s.exerciseId)),
    },
    {
      dayNumber: 2,
      label: 'PUSH',
      slots: DEFAULT_PROGRAM_BLUEPRINT[2].map((s) => slot(s.muscleGroup, s.exerciseId)),
    },
    {
      dayNumber: 3,
      label: 'LEGS',
      slots: DEFAULT_PROGRAM_BLUEPRINT[3].map((s) => slot(s.muscleGroup, s.exerciseId)),
    },
    { dayNumber: 4, label: 'REST', slots: [] },
    {
      dayNumber: 5,
      label: 'PULL',
      slots: DEFAULT_PROGRAM_BLUEPRINT[5].map((s) => slot(s.muscleGroup, s.exerciseId)),
    },
    {
      dayNumber: 6,
      label: 'PUSH',
      slots: DEFAULT_PROGRAM_BLUEPRINT[6].map((s) => slot(s.muscleGroup, s.exerciseId)),
    },
    {
      dayNumber: 7,
      label: 'LEGS',
      slots: DEFAULT_PROGRAM_BLUEPRINT[7].map((s) => slot(s.muscleGroup, s.exerciseId)),
    },
  ];
};

interface ProgramState {
  days: ProgramDay[];
  /** Link a specific exercise from the library to a program slot */
  assignExercise: (dayNumber: number, slotId: string, exerciseId: string) => void;
  /** Remove exercise assignment from a slot (reverts to muscle-group-only display) */
  unassignExercise: (dayNumber: number, slotId: string) => void;
  /** Add a new exercise slot to a day with the given muscle group */
  addSlot: (dayNumber: number, muscleGroup: MuscleGroup) => void;
  /** Remove an exercise slot from a day */
  removeSlot: (dayNumber: number, slotId: string) => void;
  /** Rename a day (e.g. change "PULL" to "UPPER") */
  updateDayLabel: (dayNumber: number, label: string) => void;
  /** Reorder a slot within its day (swap with adjacent slot) */
  moveSlot: (dayNumber: number, slotId: string, direction: 'up' | 'down') => void;
  /** Reset entire program to factory defaults — clears all customizations */
  resetProgram: () => void;
}

export const useProgramStore = create<ProgramState>()(
  persist(
    (set) => ({
      days: createDefaultProgram(),

      assignExercise: (dayNumber, slotId, exerciseId) =>
        set((state) => ({
          days: state.days.map((d) =>
            d.dayNumber === dayNumber
              ? { ...d, slots: d.slots.map((s) => (s.id === slotId ? { ...s, exerciseId } : s)) }
              : d
          ),
        })),

      unassignExercise: (dayNumber, slotId) =>
        set((state) => ({
          days: state.days.map((d) =>
            d.dayNumber === dayNumber
              ? { ...d, slots: d.slots.map((s) => (s.id === slotId ? { ...s, exerciseId: null } : s)) }
              : d
          ),
        })),

      addSlot: (dayNumber, muscleGroup) =>
        set((state) => ({
          days: state.days.map((d) =>
            d.dayNumber === dayNumber
              ? { ...d, slots: [...d.slots, { id: generateId(), muscleGroup, exerciseId: null }] }
              : d
          ),
        })),

      removeSlot: (dayNumber, slotId) =>
        set((state) => ({
          days: state.days.map((d) =>
            d.dayNumber === dayNumber
              ? { ...d, slots: d.slots.filter((s) => s.id !== slotId) }
              : d
          ),
        })),

      updateDayLabel: (dayNumber, label) =>
        set((state) => ({
          days: state.days.map((d) => (d.dayNumber === dayNumber ? { ...d, label } : d)),
        })),

      moveSlot: (dayNumber, slotId, direction) =>
        set((state) => ({
          days: state.days.map((d) => {
            if (d.dayNumber !== dayNumber) return d;
            const idx = d.slots.findIndex((s) => s.id === slotId);
            if (idx === -1) return d;
            const newIdx = direction === 'up' ? idx - 1 : idx + 1;
            if (newIdx < 0 || newIdx >= d.slots.length) return d; // boundary check
            // Swap slots at idx and newIdx
            const newSlots = [...d.slots];
            [newSlots[idx], newSlots[newIdx]] = [newSlots[newIdx], newSlots[idx]];
            return { ...d, slots: newSlots };
          }),
        })),

      resetProgram: () => set({ days: createDefaultProgram() }),
    }),
    {
      name: 'gymapp-program',
      storage: createJSONStorage(() => fallbackStorage),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<ProgramState>;
        const persistedDays = Array.isArray(persisted.days) ? persisted.days : currentState.days;
        return {
          ...currentState,
          ...persisted,
          days: backfillDefaultAssignments(persistedDays),
        };
      },
    }
  )
);
