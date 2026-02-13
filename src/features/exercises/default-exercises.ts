/**
 * @file Default seeded exercises with stable IDs and image paths.
 *
 * Business context:
 * - These exercises represent the baseline 7-day workout template visuals.
 * - IDs are deterministic so program slots can safely reference them.
 * - Image path is used as a stable visual identity for "last time" history matching.
 */

import type { Exercise } from '@/types';

export type DefaultExerciseSeed = Exercise;

export const DEFAULT_EXERCISES: DefaultExerciseSeed[] = [
  { id: 'seed-back-1', name: 'Back', muscleGroup: 'back', weightType: 'barbell', imageUrl: '/images/exercises/all/Back.png' },
  { id: 'seed-back-2', name: 'Back 2', muscleGroup: 'back', weightType: 'barbell', imageUrl: '/images/exercises/all/Back2.png' },
  { id: 'seed-biceps-1', name: 'Biceps', muscleGroup: 'biceps', weightType: 'barbell', imageUrl: '/images/exercises/all/Biceps.png' },
  { id: 'seed-rear-delts-1', name: 'Rear Delts', muscleGroup: 'rear_delts', weightType: 'dumbbell', imageUrl: '/images/exercises/all/Rear Delts.png' },
  { id: 'seed-abs-1', name: 'ABS', muscleGroup: 'abs', weightType: 'bodyweight', imageUrl: '/images/exercises/all/ABS.png' },
  { id: 'seed-chest-1', name: 'Chest', muscleGroup: 'chest', weightType: 'barbell', imageUrl: '/images/exercises/all/Chest.png' },
  { id: 'seed-shoulders-2', name: 'Shoulders 2', muscleGroup: 'shoulders', weightType: 'dumbbell', imageUrl: '/images/exercises/all/Shoulders2.png' },
  { id: 'seed-chest-2', name: 'Chest 2', muscleGroup: 'chest', weightType: 'dumbbell', imageUrl: '/images/exercises/all/Chest2.png' },
  { id: 'seed-shoulders-1', name: 'Shoulders', muscleGroup: 'shoulders', weightType: 'dumbbell', imageUrl: '/images/exercises/all/Shoulders.png' },
  { id: 'seed-triceps-1', name: 'Triceps', muscleGroup: 'triceps', weightType: 'dumbbell', imageUrl: '/images/exercises/all/Triceps.png' },
  { id: 'seed-legs-1', name: 'Legs', muscleGroup: 'legs', weightType: 'barbell', imageUrl: '/images/exercises/all/Legs.png' },
  { id: 'seed-hamstring-1', name: 'Hamstring', muscleGroup: 'hamstring', weightType: 'barbell', imageUrl: '/images/exercises/all/Hamstring.png' },
  { id: 'seed-legs-2', name: 'Legs 2', muscleGroup: 'legs', weightType: 'bodyweight', imageUrl: '/images/exercises/all/Legs2.png' },
  { id: 'seed-calves-1', name: 'Calves', muscleGroup: 'calves', weightType: 'dumbbell', imageUrl: '/images/exercises/all/Calves.png' },
  { id: 'seed-legs-3', name: 'Legs 3', muscleGroup: 'legs', weightType: 'barbell', imageUrl: '/images/exercises/all/Legs3.png' },
  { id: 'seed-back-3', name: 'Back 3', muscleGroup: 'back', weightType: 'dumbbell', imageUrl: '/images/exercises/all/Back3.png' },
  { id: 'seed-biceps-2', name: 'Biceps 2', muscleGroup: 'biceps', weightType: 'dumbbell', imageUrl: '/images/exercises/all/Biceps2.png' },
  { id: 'seed-traps-1', name: 'Traps', muscleGroup: 'traps', weightType: 'barbell', imageUrl: '/images/exercises/all/Traps.png' },
  { id: 'seed-shoulders-3', name: 'Shoulders 3', muscleGroup: 'shoulders', weightType: 'barbell', imageUrl: '/images/exercises/all/Shoulders3.png' },
  { id: 'seed-chest-3', name: 'Chest 3', muscleGroup: 'chest', weightType: 'bodyweight', imageUrl: '/images/exercises/all/Chest3.png' },
  { id: 'seed-triceps-2', name: 'Triceps 2', muscleGroup: 'triceps', weightType: 'dumbbell', imageUrl: '/images/exercises/all/Triceps2.png' },
  { id: 'seed-hamstring-2', name: 'Hamstring 2', muscleGroup: 'hamstring', weightType: 'dumbbell', imageUrl: '/images/exercises/all/Hamstring2.png' },
  { id: 'seed-quads-1', name: 'Quads', muscleGroup: 'quads', weightType: 'dumbbell', imageUrl: '/images/exercises/all/Quads.png' },
];

export const DEFAULT_EXERCISE_BY_ID = Object.fromEntries(
  DEFAULT_EXERCISES.map((exercise) => [exercise.id, exercise])
) as Record<string, DefaultExerciseSeed>;
