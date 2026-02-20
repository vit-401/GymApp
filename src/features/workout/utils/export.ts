/**
 * @file Workout session text export utility.
 *
 * Business context:
 * - After completing a workout, users can copy a plain-text summary to share (e.g. notes, messaging).
 * - Format is designed to be human-readable and compact for quick sharing.
 * - Also used in Settings page to export ALL completed sessions at once.
 *
 * Output format example:
 *   D2 PUSH
 *
 *   Bench Press
 *   12 - 2*65
 *   10 - 2*75
 *
 *   Shoulder Press
 *   15 - 2*25
 */

import type { WorkoutSession, ProgramDay, WorkoutSet, Exercise } from '@/types';
import { MUSCLE_GROUP_LABELS } from '@/types';

/**
 * Format a single set for text export.
 *
 * Produces:
 *   "reps - multiplier*weight"  (dumbbell-style, e.g. "12 - 2*65")
 *   "reps - weight"             (barbell/machine, e.g. "10 - 80")
 *   "reps"                      (bodyweight, e.g. "15")
 */
function formatSet(set: WorkoutSet): string {
  const { reps, weight, multiplier } = set;

  if (weight && multiplier && multiplier > 1) {
    return `${reps} - ${multiplier}*${weight}`;
  }
  if (weight) {
    return `${reps} - ${weight}`;
  }
  return String(reps);
}

/**
 * Export a completed session as plain text.
 *
 * Resolution order for exercise labels:
 * 1. Actual exercise name (via getExerciseById from the library)
 * 2. Muscle group label from the program slot (fallback)
 * 3. "Unknown" (should never happen in practice)
 *
 * @param session - The completed workout session to export
 * @param programDay - The program day definition (for slot → muscle group mapping)
 * @param getExerciseById - Optional lookup function from the exercises store
 */
export function formatSessionText(
  session: WorkoutSession,
  programDay: ProgramDay,
  getExerciseById?: (id: string) => Exercise | undefined
): string {
  const lines: string[] = [];

  // Header: day number + label (e.g. "D2 PUSH")
  lines.push(`D${session.dayNumber} ${session.dayLabel}`);

  for (const se of session.exercises ?? []) {
    // Resolve exercise name: prefer assigned exercise, fallback to muscle group label
    const slot = programDay.slots.find((s) => s.id === se.slotId);
    const exercise =
      (slot?.exerciseId && getExerciseById ? getExerciseById(slot.exerciseId) : undefined) ??
      (getExerciseById ? getExerciseById(se.exerciseId) : undefined);
    const label =
      exercise?.name ??
      (slot ? MUSCLE_GROUP_LABELS[slot.muscleGroup] : 'Unknown');

    lines.push(''); // Blank line separator before each exercise
    lines.push(label);
    for (const set of se.sets) {
      lines.push(formatSet(set));
    }
  }

  return lines.join('\n');
}
