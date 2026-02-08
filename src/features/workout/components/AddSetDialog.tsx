/**
 * @file Dialog for logging a new set (reps + weight + multiplier).
 *
 * Business context:
 * - Opened when user taps the "+" button on an ExerciseCard during a workout.
 * - Collects: reps (required), weight in lbs (optional), multiplier (optional, e.g. 2 for dumbbells).
 * - Pre-fills from the last logged set for quick repeat entries (common gym pattern).
 * - Weight and multiplier fields are always shown — the user decides what to fill.
 * - On submit, the set data (without ID) is passed to the parent for store mutation.
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { WorkoutSet } from '@/types';

interface AddSetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Display name for the exercise (muscle group label or exercise name) */
  name: string;
  /** Callback with set data (reps, weight, multiplier) — parent handles store mutation */
  onAdd: (set: Omit<WorkoutSet, 'id'>) => void;
  /** Last logged set — used to pre-fill inputs for quick repeat entry */
  lastSet?: WorkoutSet;
}

export function AddSetDialog({ open, onOpenChange, name, onAdd, lastSet }: AddSetDialogProps) {
  /* Form state — initialized from lastSet for convenience */
  const [reps, setReps] = useState(lastSet?.reps?.toString() ?? '12');
  const [weight, setWeight] = useState(lastSet?.weight?.toString() ?? '');
  const [multiplier, setMultiplier] = useState(lastSet?.multiplier?.toString() ?? '');

  /* Sync form values when lastSet changes (e.g. after adding a set, the new last set updates) */
  useEffect(() => {
    if (lastSet) {
      setReps(lastSet.reps.toString());
      if (lastSet.weight) setWeight(lastSet.weight.toString());
      if (lastSet.multiplier) setMultiplier(lastSet.multiplier.toString());
    }
  }, [lastSet]);

  /** Validate inputs and submit set data */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const repsNum = parseInt(reps, 10);
    if (isNaN(repsNum) || repsNum <= 0) return; // Reps is required and must be positive

    const set: Omit<WorkoutSet, 'id'> = { reps: repsNum };

    // Weight and multiplier are optional — only include if provided
    if (weight) {
      set.weight = parseFloat(weight);
    }
    if (multiplier) {
      set.multiplier = parseInt(multiplier, 10);
    }

    onAdd(set);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>Add Set</DialogTitle>
          <DialogDescription>{name}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-2">
          {/* Reps input — required, numeric */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Reps</label>
            <Input
              type="number"
              inputMode="numeric"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              placeholder="12"
              autoFocus
              min={1}
            />
          </div>

          {/* Weight input — optional, supports decimal (e.g. 2.5 lb increments) */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Weight (lbs)</label>
            <Input
              type="number"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="0"
              step="2.5"
              min={0}
            />
          </div>

          {/* Multiplier input — e.g. 2 for dumbbells (two hands × weight) */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Multiplier (e.g. 2 for dumbbells)
            </label>
            <Input
              type="number"
              inputMode="numeric"
              value={multiplier}
              onChange={(e) => setMultiplier(e.target.value)}
              placeholder="1"
              min={1}
            />
          </div>

          <Button type="submit" className="mt-1">
            Add Set
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
