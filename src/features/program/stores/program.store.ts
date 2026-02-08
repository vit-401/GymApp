import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProgramDay, WorkoutSlot, MuscleGroup } from '@/types';
import { generateId } from '@/utils/ids';

/** Default 7-day program from user's spec */
const createDefaultProgram = (): ProgramDay[] => {
  const slot = (mg: MuscleGroup): WorkoutSlot => ({ id: generateId(), muscleGroup: mg, exerciseId: null });

  return [
    { dayNumber: 1, label: 'PULL', slots: [slot('back'), slot('back'), slot('biceps'), slot('rear_delts'), slot('abs')] },
    { dayNumber: 2, label: 'PUSH', slots: [slot('chest'), slot('shoulders'), slot('chest'), slot('shoulders'), slot('triceps')] },
    { dayNumber: 3, label: 'LEGS', slots: [slot('legs'), slot('hamstring'), slot('legs'), slot('calves')] },
    { dayNumber: 4, label: 'REST', slots: [] },
    { dayNumber: 5, label: 'PULL', slots: [slot('legs'), slot('back'), slot('back'), slot('biceps'), slot('traps'), slot('abs')] },
    { dayNumber: 6, label: 'PUSH', slots: [slot('chest'), slot('shoulders'), slot('chest'), slot('shoulders'), slot('triceps')] },
    { dayNumber: 7, label: 'LEGS', slots: [slot('legs'), slot('hamstring'), slot('quads'), slot('calves')] },
  ];
};

interface ProgramState {
  days: ProgramDay[];
  assignExercise: (dayNumber: number, slotId: string, exerciseId: string) => void;
  unassignExercise: (dayNumber: number, slotId: string) => void;
  addSlot: (dayNumber: number, muscleGroup: MuscleGroup) => void;
  removeSlot: (dayNumber: number, slotId: string) => void;
  updateDayLabel: (dayNumber: number, label: string) => void;
  moveSlot: (dayNumber: number, slotId: string, direction: 'up' | 'down') => void;
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
            if (newIdx < 0 || newIdx >= d.slots.length) return d;
            const newSlots = [...d.slots];
            [newSlots[idx], newSlots[newIdx]] = [newSlots[newIdx], newSlots[idx]];
            return { ...d, slots: newSlots };
          }),
        })),

      resetProgram: () => set({ days: createDefaultProgram() }),
    }),
    { name: 'gymapp-program' }
  )
);
