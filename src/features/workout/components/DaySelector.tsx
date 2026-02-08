import { useProgramStore } from '@/features/program/stores/program.store';
import { useWorkoutStore } from '@/features/workout/stores/workout.store';
import { cn } from '@/utils/cn';

export function DaySelector() {
  const days = useProgramStore((s) => s.days);
  const currentDayNumber = useWorkoutStore((s) => s.currentDayNumber);
  const setCurrentDay = useWorkoutStore((s) => s.setCurrentDay);

  return (
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar px-4 py-3">
      {days.map((day) => (
        <button
          key={day.dayNumber}
          onClick={() => setCurrentDay(day.dayNumber)}
          className={cn(
            'flex flex-col items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0',
            currentDayNumber === day.dayNumber
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
              : 'bg-card text-muted-foreground hover:bg-secondary'
          )}
        >
          <span className="text-[10px] opacity-70">D{day.dayNumber}</span>
          <span>{day.label}</span>
        </button>
      ))}
    </div>
  );
}
