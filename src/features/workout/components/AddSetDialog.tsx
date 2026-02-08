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
  name: string;
  onAdd: (set: Omit<WorkoutSet, 'id'>) => void;
  /** Pre-fill from last set for quick entry */
  lastSet?: WorkoutSet;
}

export function AddSetDialog({ open, onOpenChange, name, onAdd, lastSet }: AddSetDialogProps) {
  const [reps, setReps] = useState(lastSet?.reps?.toString() ?? '12');
  const [weight, setWeight] = useState(lastSet?.weight?.toString() ?? '');
  const [multiplier, setMultiplier] = useState(lastSet?.multiplier?.toString() ?? '');

  // Sync defaults when lastSet changes (e.g. after adding a set)
  useEffect(() => {
    if (lastSet) {
      setReps(lastSet.reps.toString());
      if (lastSet.weight) setWeight(lastSet.weight.toString());
      if (lastSet.multiplier) setMultiplier(lastSet.multiplier.toString());
    }
  }, [lastSet]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const repsNum = parseInt(reps, 10);
    if (isNaN(repsNum) || repsNum <= 0) return;

    const set: Omit<WorkoutSet, 'id'> = { reps: repsNum };

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
