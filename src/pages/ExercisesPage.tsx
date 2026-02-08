/**
 * @file Exercises page — exercise library management.
 *
 * Business context:
 * - Simple wrapper page that renders the ExerciseList component.
 * - Users manage their personal exercise library here: add, edit, delete exercises.
 * - Exercises created here can be assigned to program day slots.
 *
 * Route: /exercises
 */

import { ExerciseList } from '@/features/exercises/components/ExerciseList';

export function ExercisesPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-bold">Exercises</h1>
      <ExerciseList />
    </div>
  );
}
