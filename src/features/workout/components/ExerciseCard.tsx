/**
 * @file Exercise card component — one card per program slot in the daily workout.
 *
 * Business context:
 * - Each card represents one exercise slot from the program day.
 * - Shows: muscle group icon (first letter), muscle group label, set count.
 * - Users tap "+" to open AddSetDialog and log reps/weight/multiplier.
 * - Logged sets appear as a list below the header with set number, formatted details, and delete button.
 * - Delete set triggers a confirmation dialog to prevent accidental removal.
 * - readOnly mode (when workout is completed): hides add/delete buttons.
 *
 * Set display format: "12 reps · 2×65 lbs" (dumbbell) or "10 reps · 80 lbs" (barbell) or "15 reps" (bodyweight)
 */

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { WorkoutSlot, SessionExercise, WorkoutSet } from '@/types';
import { MUSCLE_GROUP_LABELS } from '@/types';
import { AddSetDialog } from './AddSetDialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/utils/cn';

interface ExerciseCardProps {
  /** The program slot this card represents (muscle group + optional exercise assignment) */
  slot: WorkoutSlot;
  /** Logged sets for this slot in the current session (undefined if no sets logged yet) */
  sessionExercise?: SessionExercise;
  /** Callback to add a new set — (slotId, exerciseId, setData) */
  onAddSet: (slotId: string, exerciseId: string, set: Omit<WorkoutSet, 'id'>) => void;
  /** Callback to remove a set — (slotId, setId) */
  onRemoveSet: (slotId: string, setId: string) => void;
  /** When true, hides add/delete buttons (workout is completed and locked) */
  readOnly?: boolean;
}

/** Format a single set for inline display (e.g. "12 reps · 2×65 lbs") */
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

export function ExerciseCard({ slot, sessionExercise, onAddSet, onRemoveSet, readOnly }: ExerciseCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  /* Confirmation dialog state for set deletion */
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  /** Open confirmation dialog before deleting a set */
  const handleRemove = (setId: string) => {
    setPendingDeleteId(setId);
    setConfirmOpen(true);
  };

  /** Execute the pending set deletion after user confirms */
  const handleConfirmDelete = () => {
    if (!pendingDeleteId) return;
    onRemoveSet(slot.id, pendingDeleteId);
    setPendingDeleteId(null);
    setConfirmOpen(false);
  };

  const sets = sessionExercise?.sets ?? [];
  const lastSet = sets.length > 0 ? sets[sets.length - 1] : undefined;
  const label = MUSCLE_GROUP_LABELS[slot.muscleGroup];

  return (
    <>
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        {/* Card header: muscle group icon, label, set count, add button */}
        <div className="flex items-center gap-3 p-3">
          {/* First-letter avatar as a simple visual identifier */}
          <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center text-lg font-bold text-muted-foreground">
            {label.charAt(0)}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{label}</p>
            {sets.length > 0 && (
              <p className="text-xs text-muted-foreground">{sets.length} set{sets.length !== 1 ? 's' : ''}</p>
            )}
          </div>

          {/* Add set button — hidden in readOnly mode */}
          {!readOnly && (
            <button
              onClick={() => setDialogOpen(true)}
              className="flex items-center justify-center h-9 w-9 rounded-full bg-primary text-primary-foreground active:scale-95 transition-transform shrink-0"
              aria-label="Add set"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Logged sets list */}
        {sets.length > 0 && (
          <div className="px-3 pb-3 flex flex-col gap-1">
            {sets.map((set, idx) => (
              <div
                key={set.id}
                className={cn(
                  'flex items-center justify-between py-1.5 px-2 rounded-md text-sm',
                  idx % 2 === 0 ? 'bg-secondary/50' : '' // Zebra striping for readability
                )}
              >
                <span className="text-xs text-muted-foreground w-6">#{idx + 1}</span>
                <span className="flex-1 font-medium">{formatSet(set)}</span>
                {/* Delete button — hidden in readOnly mode */}
                {!readOnly && (
                  <button
                    onClick={() => handleRemove(set.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
                    aria-label="Remove set"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add set dialog — pre-fills from last set for quick repeat */}
      <AddSetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        name={label}
        onAdd={(setData) => onAddSet(slot.id, slot.id, setData)}
        lastSet={lastSet}
      />

      {/* Delete set confirmation dialog — prevents accidental removal */}
      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null);
          setConfirmOpen(open);
        }}
      >
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Delete set?</DialogTitle>
            <DialogDescription>This action can't be undone.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPendingDeleteId(null);
                setConfirmOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
