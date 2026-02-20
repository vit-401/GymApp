/**
 * @file Calendar page — monthly overview of workout completion history.
 *
 * Business context:
 * - Visual calendar shows which days had completed workouts (green cells).
 * - Clicking a date reveals session details for that day (exercises, set counts).
 * - Legend explains the color coding: green = completed, ring = today, grey = missed.
 * - Helps users track consistency and identify workout gaps.
 *
 * Route: /calendar
 */

import { useMemo, useState } from 'react';
import { Calendar } from '@/components/Calendar/Calendar';
import { useWorkoutStore } from '@/features/workout/stores/workout.store';
import { useExercisesStore } from '@/features/exercises/stores/exercises.store';
import { formatDisplayDate } from '@/utils/date';
import type { WorkoutSession, WorkoutSet } from '@/types';

/** Format a single set as compact text: "12×65" or "12×2×30" or "15" */
function formatSet(set: WorkoutSet): string {
  const { reps, weight, multiplier } = set;
  if (weight && multiplier && multiplier > 1) return `${reps}×${multiplier}×${weight}`;
  if (weight) return `${reps}×${weight}`;
  return String(reps);
}

export function CalendarPage() {
  const sessions = useWorkoutStore((s) => s.sessions);
  const getExerciseById = useExercisesStore((s) => s.getExerciseById);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  /** Set of dates with at least one completed session — drives calendar green highlighting */
  const completedDates = useMemo(
    () => new Set(sessions.filter((s) => s.completed).map((s) => s.date)),
    [sessions]
  );

  /** All sessions for the selected date (for the detail panel below the calendar) */
  const selectedSessions: WorkoutSession[] = useMemo(() => {
    if (!selectedDate) return [];
    return sessions.filter((s) => s.date === selectedDate);
  }, [sessions, selectedDate]);

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-bold">Calendar</h1>

      {/* Monthly calendar grid */}
      <Calendar completedDates={completedDates} onDateClick={setSelectedDate} />

      {/* Color legend for calendar cells */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-success" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm ring-2 ring-primary ring-inset" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-secondary" />
          <span>Missed</span>
        </div>
      </div>

      {/* Selected date detail panel — shows full workout breakdown */}
      {selectedDate && (
        <div className="bg-card rounded-xl border border-border/50 p-4">
          <h3 className="text-sm font-semibold mb-3">{formatDisplayDate(selectedDate)}</h3>
          {selectedSessions.length === 0 ? (
            <p className="text-xs text-muted-foreground">No workout recorded</p>
          ) : (
            selectedSessions.map((session) => (
              <div key={session.id} className="mb-3 last:mb-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold">
                    D{session.dayNumber} {session.dayLabel}
                  </span>
                  {session.completed && (
                    <span className="text-[10px] bg-success/20 text-success px-1.5 py-0.5 rounded-full font-medium">
                      Done
                    </span>
                  )}
                </div>
                {(session.exercises ?? []).map((se) => {
                  const exercise = getExerciseById(se.exerciseId);
                  return (
                    <div key={se.slotId} className="mb-2 last:mb-0">
                      <p className="text-xs font-medium text-foreground">
                        {exercise?.name ?? se.exerciseId}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(se.sets ?? []).map((s) => formatSet(s)).join('  ·  ')}
                      </p>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
