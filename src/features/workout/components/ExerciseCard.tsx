import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { WorkoutSlot, SessionExercise, WorkoutSet } from '@/types';
import { MUSCLE_GROUP_LABELS } from '@/types';
import { AddSetDialog } from './AddSetDialog';
import { cn } from '@/utils/cn';

interface ExerciseCardProps {
  slot: WorkoutSlot;
  sessionExercise?: SessionExercise;
  onAddSet: (slotId: string, exerciseId: string, set: Omit<WorkoutSet, 'id'>) => void;
  onRemoveSet: (slotId: string, setId: string) => void;
}

function formatSet(set: WorkoutSet): string {
  const parts: string[] = [];
  parts.push(`${set.reps} reps`);

  if (set.weight) {
    if (set.multiplier && set.multiplier > 1) {
      parts.push(`${set.multiplier}×${set.weight} lbs`);
    } else {
      parts.push(`${set.weight} lbs`);
    }
  }

  return parts.join(' · ');
}

export function ExerciseCard({ slot, sessionExercise, onAddSet, onRemoveSet }: ExerciseCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const sets = sessionExercise?.sets ?? [];
  const lastSet = sets.length > 0 ? sets[sets.length - 1] : undefined;
  const label = MUSCLE_GROUP_LABELS[slot.muscleGroup];

  return (
    <>
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-3">
          <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center text-lg font-bold text-muted-foreground">
            {label.charAt(0)}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{label}</p>
            {sets.length > 0 && (
              <p className="text-xs text-muted-foreground">{sets.length} set{sets.length !== 1 ? 's' : ''}</p>
            )}
          </div>

          <button
            onClick={() => setDialogOpen(true)}
            className="flex items-center justify-center h-9 w-9 rounded-full bg-primary text-primary-foreground active:scale-95 transition-transform shrink-0"
            aria-label="Add set"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Logged sets */}
        {sets.length > 0 && (
          <div className="px-3 pb-3 flex flex-col gap-1">
            {sets.map((set, idx) => (
              <div
                key={set.id}
                className={cn(
                  'flex items-center justify-between py-1.5 px-2 rounded-md text-sm',
                  idx % 2 === 0 ? 'bg-secondary/50' : ''
                )}
              >
                <span className="text-xs text-muted-foreground w-6">#{idx + 1}</span>
                <span className="flex-1 font-medium">{formatSet(set)}</span>
                <button
                  onClick={() => onRemoveSet(slot.id, set.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
                  aria-label="Remove set"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddSetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        name={label}
        onAdd={(setData) => onAddSet(slot.id, slot.id, setData)}
        lastSet={lastSet}
      />
    </>
  );
}
