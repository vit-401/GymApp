/**
 * @file Workout page — the app's home/default screen.
 *
 * Business context:
 * - This is where users spend most of their time: logging daily workout sets.
 * - Shows: today's date, current day number + label, day selector pills, and the workout view.
 * - The DaySelector lets users switch between program days (D1–D7).
 * - WorkoutDayView renders exercise cards for the selected day.
 *
 * Route: / (index route)
 */

import { DaySelector } from '@/features/workout/components/DaySelector';
import { WorkoutDayView } from '@/features/workout/components/WorkoutDayView';
import { useWorkoutStore } from '@/features/workout/stores/workout.store';
import { useProgramStore } from '@/features/program/stores/program.store';
import { formatDisplayDate } from '@/utils/date';

export function WorkoutPage() {
  const currentDayNumber = useWorkoutStore((s) => s.currentDayNumber);
  const days = useProgramStore((s) => s.days);
  const currentDay = days.find((d) => d.dayNumber === currentDayNumber);

  return (
    <div className="flex flex-col">
      {/* Page header: today's date and current program day */}
      <div className="px-4 pt-4 pb-1">
        <p className="text-xs text-muted-foreground">{formatDisplayDate(new Date())}</p>
        <h1 className="text-xl font-bold">
          Day {currentDayNumber}{' '}
          {currentDay && <span className="text-primary">— {currentDay.label}</span>}
        </h1>
      </div>

      {/* Horizontal day selector pills (D1–D7) */}
      <DaySelector />

      {/* Main workout content: exercise cards, complete button, summary */}
      <WorkoutDayView />
    </div>
  );
}
