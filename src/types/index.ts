export type WeightType = 'dumbbell' | 'barbell' | 'bodyweight' | 'bodyweight_weighted' | 'machine';

export type MuscleGroup =
  | 'back'
  | 'biceps'
  | 'rear_delts'
  | 'abs'
  | 'chest'
  | 'shoulders'
  | 'triceps'
  | 'legs'
  | 'hamstring'
  | 'calves'
  | 'quads'
  | 'traps';

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  back: 'Back',
  biceps: 'Biceps',
  rear_delts: 'Rear Delts',
  abs: 'ABS',
  chest: 'Chest',
  shoulders: 'Shoulders',
  triceps: 'Triceps',
  legs: 'Legs',
  hamstring: 'Hamstring',
  calves: 'Calves',
  quads: 'Quads',
  traps: 'Traps',
};

export const WEIGHT_TYPE_LABELS: Record<WeightType, string> = {
  dumbbell: 'Dumbbell',
  barbell: 'Barbell',
  bodyweight: 'Bodyweight',
  bodyweight_weighted: 'Bodyweight + Weight',
  machine: 'Machine',
};

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  weightType: WeightType;
  imageUrl: string;
}

export interface WorkoutSlot {
  id: string;
  muscleGroup: MuscleGroup;
  exerciseId: string | null;
}

export interface ProgramDay {
  dayNumber: number;
  label: string;
  slots: WorkoutSlot[];
}

export interface WorkoutSet {
  id: string;
  reps: number;
  weight?: number;
  multiplier?: number;
}

export interface SessionExercise {
  slotId: string;
  exerciseId: string;
  sets: WorkoutSet[];
}

export interface WorkoutSession {
  id: string;
  date: string;
  dayNumber: number;
  dayLabel: string;
  exercises: SessionExercise[];
  completed: boolean;
  completedAt?: string;
}

export interface BodyMetric {
  id: string;
  /** ISO 8601 datetime string (date + time) */
  recordedAt: string;
  weight?: number;
  bellySize?: number;
}
