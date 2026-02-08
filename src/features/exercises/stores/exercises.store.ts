import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Exercise, MuscleGroup, WeightType } from '@/types';
import { generateId } from '@/utils/ids';

interface ExercisesState {
  exercises: Exercise[];
  addExercise: (data: Omit<Exercise, 'id'>) => Exercise;
  updateExercise: (id: string, data: Partial<Omit<Exercise, 'id'>>) => void;
  deleteExercise: (id: string) => void;
  getExercisesByMuscleGroup: (group: MuscleGroup) => Exercise[];
  getExerciseById: (id: string) => Exercise | undefined;
}

export const useExercisesStore = create<ExercisesState>()(
  persist(
    (set, get) => ({
      exercises: [],

      addExercise: (data) => {
        const exercise: Exercise = { id: generateId(), ...data };
        set((state) => ({ exercises: [...state.exercises, exercise] }));
        return exercise;
      },

      updateExercise: (id, data) =>
        set((state) => ({
          exercises: state.exercises.map((e) => (e.id === id ? { ...e, ...data } : e)),
        })),

      deleteExercise: (id) =>
        set((state) => ({ exercises: state.exercises.filter((e) => e.id !== id) })),

      getExercisesByMuscleGroup: (group: MuscleGroup) =>
        get().exercises.filter((e) => e.muscleGroup === group),

      getExerciseById: (id: string) => get().exercises.find((e) => e.id === id),
    }),
    { name: 'gymapp-exercises' }
  )
);

/** Helper to check if a weightType needs weight input */
export const needsWeight = (wt: WeightType): boolean =>
  wt === 'dumbbell' || wt === 'barbell' || wt === 'machine' || wt === 'bodyweight_weighted';

/** Helper to check if a weightType uses multiplier */
export const needsMultiplier = (wt: WeightType): boolean => wt === 'dumbbell';
