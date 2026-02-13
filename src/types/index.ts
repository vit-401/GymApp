/**
 * @file Core domain types for the GymApp.
 *
 * Business context:
 * - The app is a personal gym tracker with a fixed 7-day program split (PULL/PUSH/LEGS/REST).
 * - Users define exercises in a library, assign them to program slots, then log sets during workouts.
 * - Body metrics (weight, belly size) are tracked separately for progress monitoring.
 *
 * Data flow:
 *   Exercise library → Program slots → Workout sessions → Completed history → Export
 */

// ──────────────────────────────────────────────
// Enums & Labels
// ──────────────────────────────────────────────

/** Equipment type determines which inputs appear when logging a set (weight, multiplier, etc.) */
export type WeightType = 'dumbbell' | 'barbell' | 'bodyweight' | 'bodyweight_weighted' | 'machine';

/** Supported muscle groups — used to categorize exercises and program slots */
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

/** Human-readable labels for muscle groups, used in UI display and export text */
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

/**
 * Rest duration (seconds) per muscle group, used to auto-set the timer after logging a set.
 * Rule: ABS and Calves → 60s, everything else → 120s (matches WORKOUT-PROGRAM.md).
 */
export const REST_SECONDS_BY_MUSCLE_GROUP: Record<MuscleGroup, number> = {
  back: 120,
  biceps: 120,
  rear_delts: 120,
  abs: 60,
  chest: 120,
  shoulders: 120,
  triceps: 120,
  legs: 120,
  hamstring: 120,
  calves: 60,
  quads: 120,
  traps: 120,
};

/** Human-readable labels for weight/equipment types, shown in exercise forms */
export const WEIGHT_TYPE_LABELS: Record<WeightType, string> = {
  dumbbell: 'Dumbbell',
  barbell: 'Barbell',
  bodyweight: 'Bodyweight',
  bodyweight_weighted: 'Bodyweight + Weight',
  machine: 'Machine',
};

// ──────────────────────────────────────────────
// Exercise Library
// ──────────────────────────────────────────────

/**
 * An exercise in the user's personal library.
 * Exercises are created once and then assigned to program day slots.
 * Images are stored as base64 data URLs (max 200px) in localStorage.
 */
export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  /** Determines which set-logging inputs to show (weight, multiplier) */
  weightType: WeightType;
  /** Base64 data URL of exercise thumbnail (resized to 200px max) */
  imageUrl: string;
}

// ──────────────────────────────────────────────
// Program Configuration
// ──────────────────────────────────────────────

/**
 * A slot within a program day — represents one exercise position.
 * Slots define the muscle group requirement; an exercise can optionally be assigned.
 * If no exercise is assigned, the slot still appears in workouts using the muscle group label.
 */
export interface WorkoutSlot {
  id: string;
  /** The muscle group this slot targets */
  muscleGroup: MuscleGroup;
  /** ID of the assigned exercise from the library, or null if unassigned */
  exerciseId: string | null;
}

/**
 * A single day in the 7-day program split.
 * Each day has a label (e.g. "PULL", "PUSH", "LEGS", "REST") and a list of exercise slots.
 * REST days have empty slots array.
 */
export interface ProgramDay {
  /** 1-based day number within the program (1–7) */
  dayNumber: number;
  /** Display label — e.g. "PULL", "PUSH", "LEGS", "REST" */
  label: string;
  /** Ordered list of exercise slots for this day */
  slots: WorkoutSlot[];
}

// ──────────────────────────────────────────────
// Workout Session & Logging
// ──────────────────────────────────────────────

/**
 * A single logged set within a workout.
 * Weight and multiplier are optional — bodyweight exercises only need reps.
 */
export interface WorkoutSet {
  id: string;
  reps: number;
  /** Weight in lbs (optional for bodyweight exercises) */
  weight?: number;
  /** Multiplier for dumbbells (e.g. 2 = two dumbbells). Omitted or 1 for barbell/machine. */
  multiplier?: number;
}

/**
 * Logged data for one exercise slot within a session.
 * Links back to the program slot and the specific exercise used.
 */
export interface SessionExercise {
  /** References WorkoutSlot.id from the program */
  slotId: string;
  /** References Exercise.id from the library (or slot.id as fallback when unassigned) */
  exerciseId: string;
  /** All sets logged for this exercise in this session */
  sets: WorkoutSet[];
}

/**
 * A workout session — one day's worth of logged exercise data.
 * Created lazily when user first interacts with a program day.
 * At most one session per (date, dayNumber) combination.
 */
export interface WorkoutSession {
  id: string;
  /** ISO date string (yyyy-MM-dd) when the session was created */
  date: string;
  /** Which program day this session belongs to (1–7) */
  dayNumber: number;
  /** Snapshot of the day label at creation time (e.g. "PULL") */
  dayLabel: string;
  /** All exercises logged in this session */
  exercises: SessionExercise[];
  /** Whether the user has marked this workout as done */
  completed: boolean;
  /** ISO datetime string when completion was confirmed */
  completedAt?: string;
}

// ──────────────────────────────────────────────
// Body Metrics
// ──────────────────────────────────────────────

/**
 * A single body measurement record for tracking physical progress over time.
 * Users can log weight, belly size, or both in one record.
 */
export interface BodyMetric {
  id: string;
  /** ISO 8601 datetime string (date + time) when the measurement was taken */
  recordedAt: string;
  /** Body weight in lbs */
  weight?: number;
  /** Belly circumference in inches */
  bellySize?: number;
}
