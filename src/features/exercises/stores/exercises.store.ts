/**
 * @file Exercise library store (Zustand + persist).
 *
 * Business context:
 * - Users build a personal exercise library with name, muscle group, weight type, and optional image.
 * - Exercises are then assigned to program day slots for structured workouts.
 * - CRUD operations: add, update, delete. Lookup by ID and filter by muscle group.
 *
 * Persistence: full exercise list saved to localStorage (key: "gymapp-exercises").
 * Images are base64 data URLs (resized to max 200px) to keep localStorage size manageable.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Exercise, MuscleGroup, WeightType } from '@/types';
import { generateId } from '@/utils/ids';

interface ExercisesState {
  exercises: Exercise[];
  /** Create a new exercise and add it to the library. Returns the created exercise with generated ID. */
  addExercise: (data: Omit<Exercise, 'id'>) => Exercise;
  /** Update an existing exercise by ID (partial update supported) */
  updateExercise: (id: string, data: Partial<Omit<Exercise, 'id'>>) => void;
  /** Delete an exercise from the library by ID */
  deleteExercise: (id: string) => void;
  /** Get all exercises that target a specific muscle group — used for exercise picker filtering */
  getExercisesByMuscleGroup: (group: MuscleGroup) => Exercise[];
  /** Find a single exercise by ID — used for display labels in workout cards and export */
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

/**
 * Check if a weight type requires the user to input a weight value.
 * Bodyweight-only exercises don't need weight input.
 */
export const needsWeight = (wt: WeightType): boolean =>
  wt === 'dumbbell' || wt === 'barbell' || wt === 'machine' || wt === 'bodyweight_weighted';

/**
 * Check if a weight type uses a multiplier (e.g. dumbbells = 2 hands).
 * Only dumbbells use multiplier — barbell/machine are single weight values.
 */
export const needsMultiplier = (wt: WeightType): boolean => wt === 'dumbbell';
