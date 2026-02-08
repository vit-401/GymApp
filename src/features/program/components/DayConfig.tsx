import { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2, Plus, Link2, Unlink } from 'lucide-react';
import type { ProgramDay, MuscleGroup } from '@/types';
import { MUSCLE_GROUP_LABELS } from '@/types';
import { useExercisesStore } from '@/features/exercises/stores/exercises.store';
import { useProgramStore } from '@/features/program/stores/program.store';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/utils/cn';

const MUSCLE_GROUPS = Object.keys(MUSCLE_GROUP_LABELS) as MuscleGroup[];

interface DayConfigProps {
  day: ProgramDay;
}

export function DayConfig({ day }: DayConfigProps) {
  const [expanded, setExpanded] = useState(false);
  const [addSlotOpen, setAddSlotOpen] = useState(false);
  const [newSlotMg, setNewSlotMg] = useState<MuscleGroup>('chest');
  const [assignSlotId, setAssignSlotId] = useState<string | null>(null);

  const { assignExercise, unassignExercise, removeSlot, addSlot, moveSlot } = useProgramStore();
  const exercises = useExercisesStore((s) => s.exercises);
  const getExerciseById = useExercisesStore((s) => s.getExerciseById);

  const isRest = day.label === 'REST';

  return (
    <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
      {/* Day header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full p-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">D{day.dayNumber}</span>
          <span className="font-semibold text-sm">{day.label}</span>
          {!isRest && (
            <span className="text-xs text-muted-foreground">
              ({day.slots.length} exercise{day.slots.length !== 1 ? 's' : ''})
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {expanded && !isRest && (
        <div className="px-3 pb-3 flex flex-col gap-1.5">
          {day.slots.map((slot, idx) => {
            const exercise = slot.exerciseId ? getExerciseById(slot.exerciseId) : null;

            return (
              <div
                key={slot.id}
                className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-secondary/50 text-sm"
              >
                <span className="text-xs text-muted-foreground w-5">#{idx + 1}</span>
                <span className="text-xs font-medium min-w-[4rem]">
                  {MUSCLE_GROUP_LABELS[slot.muscleGroup]}
                </span>

                {exercise ? (
                  <span className="flex-1 text-xs truncate text-primary">{exercise.name}</span>
                ) : (
                  <span className="flex-1 text-xs text-muted-foreground/50">not assigned</span>
                )}

                {/* Assign / unassign */}
                {exercise ? (
                  <button
                    onClick={() => unassignExercise(day.dayNumber, slot.id)}
                    className="p-1 rounded hover:bg-background/50 text-muted-foreground"
                    aria-label="Unassign"
                  >
                    <Unlink className="h-3 w-3" />
                  </button>
                ) : (
                  <button
                    onClick={() => setAssignSlotId(slot.id)}
                    className="p-1 rounded hover:bg-background/50 text-primary"
                    aria-label="Assign exercise"
                  >
                    <Link2 className="h-3 w-3" />
                  </button>
                )}

                {/* Move up/down */}
                <div className="flex flex-col">
                  <button
                    onClick={() => moveSlot(day.dayNumber, slot.id, 'up')}
                    disabled={idx === 0}
                    className="text-muted-foreground disabled:opacity-20 hover:text-foreground"
                    aria-label="Move up"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => moveSlot(day.dayNumber, slot.id, 'down')}
                    disabled={idx === day.slots.length - 1}
                    className="text-muted-foreground disabled:opacity-20 hover:text-foreground"
                    aria-label="Move down"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </div>

                {/* Remove slot */}
                <button
                  onClick={() => removeSlot(day.dayNumber, slot.id)}
                  className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                  aria-label="Remove slot"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            );
          })}

          {/* Add slot */}
          <Button variant="outline" size="sm" onClick={() => setAddSlotOpen(true)} className="mt-1">
            <Plus className="h-3 w-3 mr-1" />
            Add Slot
          </Button>
        </div>
      )}

      {/* Add slot dialog */}
      <Dialog open={addSlotOpen} onOpenChange={setAddSlotOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Add Slot</DialogTitle>
            <DialogDescription>Select a muscle group for the new slot</DialogDescription>
          </DialogHeader>
          <Select value={newSlotMg} onValueChange={(v) => setNewSlotMg(v as MuscleGroup)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MUSCLE_GROUPS.map((mg) => (
                <SelectItem key={mg} value={mg}>
                  {MUSCLE_GROUP_LABELS[mg]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => {
              addSlot(day.dayNumber, newSlotMg);
              setAddSlotOpen(false);
            }}
          >
            Add
          </Button>
        </DialogContent>
      </Dialog>

      {/* Assign exercise dialog */}
      {assignSlotId && (
        <Dialog open={!!assignSlotId} onOpenChange={() => setAssignSlotId(null)}>
          <DialogContent className="max-w-xs">
            <DialogHeader>
              <DialogTitle>Assign Exercise</DialogTitle>
              <DialogDescription>
                Pick an exercise for this slot
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
              {(() => {
                const slot = day.slots.find((s) => s.id === assignSlotId);
                const filtered = exercises.filter(
                  (e) => !slot || e.muscleGroup === slot.muscleGroup
                );
                if (filtered.length === 0) {
                  return (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No exercises for this muscle group. Create one first.
                    </p>
                  );
                }
                return filtered.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => {
                      assignExercise(day.dayNumber, assignSlotId, ex.id);
                      setAssignSlotId(null);
                    }}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-md hover:bg-secondary text-left text-sm transition-colors'
                    )}
                  >
                    {ex.imageUrl ? (
                      <img src={ex.imageUrl} alt="" className="w-8 h-8 rounded object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">
                        {ex.name.charAt(0)}
                      </div>
                    )}
                    <span>{ex.name}</span>
                  </button>
                ));
              })()}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
