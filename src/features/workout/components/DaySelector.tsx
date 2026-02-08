/**
 * @file Horizontal day selector (pill buttons) for the workout page.
 *
 * Business context:
 * - Renders one pill button per program day (D1–D7).
 * - Users tap a pill to switch the active workout day.
 * - Completed days (today) show a green check badge for quick status overview.
 *
 * Visual states (4 combinations):
 * 1. Selected + Completed: solid emerald background + check badge
 * 2. Completed (not selected): faded emerald border + check badge
 * 3. Selected (not completed): primary background
 * 4. Default: card background, muted text
 *
 * Scrolls horizontally when days don't fit the screen width.
 */

import { Check } from 'lucide-react';
import { useProgramStore } from '@/features/program/stores/program.store';
import { useWorkoutStore } from '@/features/workout/stores/workout.store';
import { cn } from '@/utils/cn';

export function DaySelector() {
  const days = useProgramStore((s) => s.days);
  const currentDayNumber = useWorkoutStore((s) => s.currentDayNumber);
  const setCurrentDay = useWorkoutStore((s) => s.setCurrentDay);
  const isDayCompletedToday = useWorkoutStore((s) => s.isDayCompletedToday);
  // Subscribe to sessions array so component re-renders when completion status changes
  const sessions = useWorkoutStore((s) => s.sessions);

  return (
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar px-4 py-3">
      {days.map((day) => {
        const isSelected = currentDayNumber === day.dayNumber;
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const isCompleted = isDayCompletedToday(day.dayNumber);
        void sessions; // Keep subscription alive so pills re-render on session changes

        return (
          <button
            key={day.dayNumber}
            onClick={() => setCurrentDay(day.dayNumber)}
            className={cn(
              'relative flex flex-col items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0',
              // 4-state visual logic: selected+completed > completed > selected > default
              isCompleted && isSelected
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                : isCompleted
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30'
                  : isSelected
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                    : 'bg-card text-muted-foreground hover:bg-secondary'
            )}
          >
            {/* Completion badge — small green check in top-right corner */}
            {isCompleted && (
              <Check className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-600 text-white p-0.5" />
            )}
            <span className="text-[10px] opacity-70">D{day.dayNumber}</span>
            <span>{day.label}</span>
          </button>
        );
      })}
    </div>
  );
}
