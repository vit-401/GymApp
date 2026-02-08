/**
 * @file Program page — 7-day workout split configuration.
 *
 * Business context:
 * - Users configure their weekly workout program here.
 * - Each of the 7 days renders as a collapsible DayConfig card.
 * - Users can: add/remove exercise slots, assign exercises from library, reorder slots.
 * - "Reset" button restores the default program (PULL/PUSH/LEGS/REST/PULL/PUSH/LEGS).
 * - Changes here affect what appears on the WorkoutPage for daily logging.
 *
 * Route: /program
 */

import { useProgramStore } from '@/features/program/stores/program.store';
import { DayConfig } from '@/features/program/components/DayConfig';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

export function ProgramPage() {
  const days = useProgramStore((s) => s.days);
  const resetProgram = useProgramStore((s) => s.resetProgram);

  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Page header with reset button */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Program</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (confirm('Reset program to default? This will clear all exercise assignments.')) {
              resetProgram();
            }
          }}
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1" />
          Reset
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Configure your 7-day workout split. Assign exercises from your library to each slot.
      </p>

      {/* One expandable card per program day */}
      {days.map((day) => (
        <DayConfig key={day.dayNumber} day={day} />
      ))}
    </div>
  );
}
