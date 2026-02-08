import { ExerciseList } from '@/features/exercises/components/ExerciseList';

export function ExercisesPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-bold">Exercises</h1>
      <ExerciseList />
    </div>
  );
}
