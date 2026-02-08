import { useMemo, useCallback } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useProgramStore } from '@/features/program/stores/program.store';
import { useWorkoutStore } from '@/features/workout/stores/workout.store';
import { ExerciseCard } from './ExerciseCard';
import { Button } from '@/components/ui/button';
import type { WorkoutSet } from '@/types';

export function WorkoutDayView() {
  const currentDayNumber = useWorkoutStore((s) => s.currentDayNumber);
  const sessions = useWorkoutStore((s) => s.sessions);
  const getOrCreateSession = useWorkoutStore((s) => s.getOrCreateSession);
  const addSet = useWorkoutStore((s) => s.addSet);
  const removeSet = useWorkoutStore((s) => s.removeSet);
  const completeSession = useWorkoutStore((s) => s.completeSession);

  const days = useProgramStore((s) => s.days);
  const currentDay = useMemo(
    () => days.find((d) => d.dayNumber === currentDayNumber),
    [days, currentDayNumber]
  );

  const session = useMemo(() => {
    if (!currentDay) return null;
    return getOrCreateSession(currentDay.dayNumber, currentDay.label);
  }, [currentDay, getOrCreateSession, sessions]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddSet = useCallback(
    (slotId: string, exerciseId: string, setData: Omit<WorkoutSet, 'id'>) => {
      if (!session) return;
      addSet(session.id, slotId, exerciseId, setData);
    },
    [session, addSet]
  );

  const handleRemoveSet = useCallback(
    (slotId: string, setId: string) => {
      if (!session) return;
      removeSet(session.id, slotId, setId);
    },
    [session, removeSet]
  );

  const handleComplete = useCallback(() => {
    if (!session) return;
    completeSession(session.id);
  }, [session, completeSession]);

  if (!currentDay) return null;

  if (currentDay.label === 'REST') {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="text-6xl mb-4">😴</div>
        <h2 className="text-xl font-bold mb-2">Rest Day</h2>
        <p className="text-muted-foreground text-sm">Recovery is part of the process. Rest up!</p>
      </div>
    );
  }

  const hasAnySets = session?.exercises.some((e) => e.sets.length > 0) ?? false;
  const isCompleted = session?.completed ?? false;

  // Get fresh session data from store
  const freshSession = sessions.find((s) => s.id === session?.id);

  return (
    <div className="flex flex-col gap-3 px-4 pb-4">
      {currentDay.slots.map((slot) => {
        const sessionExercise = freshSession?.exercises.find(
          (e) => e.slotId === slot.id
        );

        return (
          <ExerciseCard
            key={slot.id}
            slot={slot}
            sessionExercise={sessionExercise}
            onAddSet={handleAddSet}
            onRemoveSet={handleRemoveSet}
          />
        );
      })}

      {/* Complete button */}
      {!isCompleted && currentDay.slots.length > 0 && (
        <Button
          variant="success"
          size="lg"
          className="mt-2"
          disabled={!hasAnySets}
          onClick={handleComplete}
        >
          <CheckCircle2 className="h-5 w-5 mr-2" />
          Complete Day
        </Button>
      )}

      {isCompleted && (
        <div className="flex items-center justify-center gap-2 py-4 text-success">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-semibold">Workout Completed!</span>
        </div>
      )}
    </div>
  );
}
