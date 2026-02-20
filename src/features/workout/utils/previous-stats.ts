/**
 * @file Helpers to compute "last time" exercise metrics from workout history.
 *
 * Business context:
 * - Workout cards need quick context about the previous performance for the same exercise identity.
 * - Identity is exerciseId (which maps to a unique image in seeded defaults).
 * - We return one compact summary used by both card and add-set dialog.
 */

import type { WorkoutSession, WorkoutSet } from '@/types';

export interface PreviousExerciseStats {
  /** Full ordered list of every set from the previous session */
  sets: WorkoutSet[];
  setsCount: number;
  totalReps: number;
  topWeight?: number;
}

/** Build summary metrics for a list of sets, keeping the full set list for detailed display. */
export const summarizeSets = (sets: WorkoutSet[]): PreviousExerciseStats => {
  const totalReps = sets.reduce((sum, set) => sum + set.reps, 0);
  const topWeight = sets.reduce<number | undefined>((max, set) => {
    if (typeof set.weight !== 'number') return max;
    if (typeof max !== 'number') return set.weight;
    return set.weight > max ? set.weight : max;
  }, undefined);

  return {
    sets: [...sets],
    setsCount: sets.length,
    totalReps,
    topWeight,
  };
};

const getSessionSortValue = (session: WorkoutSession): number => {
  const raw = session.completedAt ?? `${session.date}T00:00:00.000Z`;
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? 0 : parsed;
};

/**
 * Get metrics from the most recent earlier session containing this exercise ID.
 * Current active session is excluded by ID to avoid showing in-progress values as "last time".
 */
export const getPreviousExerciseStats = (
  sessions: WorkoutSession[],
  exerciseId: string,
  currentSessionId?: string
): PreviousExerciseStats | undefined => {
  const ordered = [...sessions]
    .filter((session) => session.id !== currentSessionId)
    .sort((a, b) => getSessionSortValue(b) - getSessionSortValue(a));

  for (const session of ordered) {
    if (!Array.isArray(session.exercises)) continue;
    const entry = session.exercises.find(
      (exercise) => exercise.exerciseId === exerciseId && exercise.sets.length > 0
    );
    if (entry) return summarizeSets(entry.sets);
  }

  return undefined;
};
