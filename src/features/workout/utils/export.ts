import type { WorkoutSession, Exercise } from '@/types';
import { needsWeight, needsMultiplier } from '@/features/exercises/stores/exercises.store';

/**
 * Exports a workout session in the user's compact text format:
 *
 * D2
 *
 * Chest
 * 12-2*65
 * 10-2*75
 *
 * Shoulders
 * 15-2*25
 */
export function exportSession(
  session: WorkoutSession,
  getExerciseById: (id: string) => Exercise | undefined
): string {
  const lines: string[] = [];
  lines.push(`D${session.dayNumber}`);

  for (const se of session.exercises) {
    const exercise = getExerciseById(se.exerciseId);
    if (!exercise) continue;

    lines.push('');
    lines.push(exercise.name);

    for (const set of se.sets) {
      lines.push(formatSetExport(set, exercise));
    }
  }

  return lines.join('\n');
}

function formatSetExport(
  set: { reps: number; weight?: number; multiplier?: number },
  exercise: Exercise
): string {
  const { reps, weight, multiplier } = set;

  if (exercise.weightType === 'bodyweight') {
    return String(reps);
  }

  if (exercise.weightType === 'bodyweight_weighted') {
    return weight && weight > 0 ? `${reps}+${weight}` : String(reps);
  }

  if (exercise.weightType === 'dumbbell' && needsMultiplier(exercise.weightType)) {
    return weight ? `${reps}-${multiplier ?? 2}*${weight}` : String(reps);
  }

  // barbell or machine
  if (needsWeight(exercise.weightType) && weight) {
    return `${reps}-${weight}`;
  }

  return String(reps);
}

/** Export multiple sessions (e.g. a date range) */
export function exportSessions(
  sessions: WorkoutSession[],
  getExerciseById: (id: string) => Exercise | undefined
): string {
  return sessions
    .map((s) => exportSession(s, getExerciseById))
    .join('\n\n---\n\n');
}
