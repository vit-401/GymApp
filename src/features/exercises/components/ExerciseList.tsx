import { useState } from 'react';
import { Plus, Pencil, Trash2, ImageOff } from 'lucide-react';
import { useExercisesStore } from '@/features/exercises/stores/exercises.store';
import { ExerciseForm } from './ExerciseForm';
import { Button } from '@/components/ui/button';
import { MUSCLE_GROUP_LABELS, WEIGHT_TYPE_LABELS } from '@/types';
import type { Exercise } from '@/types';

export function ExerciseList() {
  const exercises = useExercisesStore((s) => s.exercises);
  const addExercise = useExercisesStore((s) => s.addExercise);
  const updateExercise = useExercisesStore((s) => s.updateExercise);
  const deleteExercise = useExercisesStore((s) => s.deleteExercise);

  const [addOpen, setAddOpen] = useState(false);
  const [editExercise, setEditExercise] = useState<Exercise | null>(null);

  return (
    <div className="flex flex-col gap-3">
      {/* Add button */}
      <Button onClick={() => setAddOpen(true)} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Exercise
      </Button>

      {/* Exercise list */}
      {exercises.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          <p>No exercises yet.</p>
          <p className="text-xs mt-1">Add exercises to use in your workout program.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {exercises.map((ex) => (
            <div
              key={ex.id}
              className="flex items-center gap-3 bg-card rounded-xl border border-border/50 p-3"
            >
              {ex.imageUrl ? (
                <img
                  src={ex.imageUrl}
                  alt={ex.name}
                  className="w-11 h-11 rounded-lg object-cover bg-secondary shrink-0"
                />
              ) : (
                <div className="w-11 h-11 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <ImageOff className="h-4 w-4 text-muted-foreground" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{ex.name}</p>
                <p className="text-xs text-muted-foreground">
                  {MUSCLE_GROUP_LABELS[ex.muscleGroup]} · {WEIGHT_TYPE_LABELS[ex.weightType]}
                </p>
              </div>

              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => setEditExercise(ex)}
                  className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground"
                  aria-label="Edit"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (confirm('Delete this exercise?')) deleteExercise(ex.id);
                  }}
                  className="p-1.5 rounded-md hover:bg-destructive/20 transition-colors text-muted-foreground hover:text-destructive"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add dialog */}
      <ExerciseForm
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={(data) => addExercise(data)}
      />

      {/* Edit dialog */}
      {editExercise && (
        <ExerciseForm
          open={!!editExercise}
          onOpenChange={(open) => {
            if (!open) setEditExercise(null);
          }}
          initial={editExercise}
          onSubmit={(data) => {
            updateExercise(editExercise.id, data);
            setEditExercise(null);
          }}
        />
      )}
    </div>
  );
}
