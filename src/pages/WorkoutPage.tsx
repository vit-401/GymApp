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
      {/* Header */}
      <div className="px-4 pt-4 pb-1">
        <p className="text-xs text-muted-foreground">{formatDisplayDate(new Date())}</p>
        <h1 className="text-xl font-bold">
          Day {currentDayNumber}{' '}
          {currentDay && <span className="text-primary">— {currentDay.label}</span>}
        </h1>
      </div>

      {/* Day pills */}
      <DaySelector />

      {/* Workout content */}
      <WorkoutDayView />
    </div>
  );
}
