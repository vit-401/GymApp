/**
 * @file Workout session store (Zustand + persist).
 *
 * Business context:
 * - This is the core data store for the app's primary feature: logging workouts.
 * - Sessions are created lazily (one per date+dayNumber combo) when the user first visits a workout day.
 * - Users log sets (reps, weight, multiplier) for each exercise slot, then mark the day as complete.
 * - Completed sessions show on the calendar, can be exported as text, and can be reopened for edits.
 *
 * Key behaviors:
 * - getOrCreateSession: idempotent — returns existing session for today or creates a new one.
 * - addSet: creates the SessionExercise entry if it doesn't exist yet (first set for that slot).
 * - removeSet: cleans up empty SessionExercise entries after last set is removed.
 * - completeSession / uncompleteSession: toggles the "done" state with timestamp.
 *
 * Persistence: full sessions array saved to localStorage (key: "gymapp-workouts").
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WorkoutSession, SessionExercise, WorkoutSet } from '@/types';
import { generateId } from '@/utils/ids';
import { getToday } from '@/utils/date';

interface WorkoutState {
  sessions: WorkoutSession[];
  /** Which program day the user is currently viewing (1–7), persisted across sessions */
  currentDayNumber: number;

  /** Switch the currently selected program day */
  setCurrentDay: (dayNumber: number) => void;

  /** Get today's session for a given day, or create one if it doesn't exist yet */
  getOrCreateSession: (dayNumber: number, dayLabel: string) => WorkoutSession;

  /** Add a set to a specific exercise slot within a session */
  addSet: (sessionId: string, slotId: string, exerciseId: string, set: Omit<WorkoutSet, 'id'>) => void;

  /** Remove a single set from a session exercise. Auto-cleans empty exercise entries. */
  removeSet: (sessionId: string, slotId: string, setId: string) => void;

  /** Mark a session as completed with a timestamp */
  completeSession: (sessionId: string) => void;

  /** Reopen a completed session for editing (removes completed flag) */
  uncompleteSession: (sessionId: string) => void;

  /** Check if today's session for a given day number is already completed */
  isDayCompletedToday: (dayNumber: number) => boolean;

  /** Get all sessions recorded on a specific date (for calendar detail view) */
  getSessionsByDate: (date: string) => WorkoutSession[];

  /** Get unique dates where at least one session was completed (for calendar highlighting) */
  getCompletedDates: () => string[];

  /** Delete all workout history — used in Settings danger zone */
  clearSessions: () => void;
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentDayNumber: 1,

      setCurrentDay: (dayNumber) => set({ currentDayNumber: dayNumber }),

      getOrCreateSession: (dayNumber, dayLabel) => {
        const today = getToday();
        // Check if a session already exists for this day + date combo
        const existing = get().sessions.find(
          (s) => s.date === today && s.dayNumber === dayNumber
        );
        if (existing) return existing;

        // Create new empty session for today
        const session: WorkoutSession = {
          id: generateId(),
          date: today,
          dayNumber,
          dayLabel,
          exercises: [],
          completed: false,
        };
        set((state) => ({ sessions: [...state.sessions, session] }));
        return session;
      },

      addSet: (sessionId, slotId, exerciseId, setData) =>
        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id !== sessionId) return s;

            // Find existing exercise entry for this slot
            const exerciseIdx = s.exercises.findIndex(
              (e) => e.slotId === slotId && e.exerciseId === exerciseId
            );
            const newSet: WorkoutSet = { id: generateId(), ...setData };

            if (exerciseIdx >= 0) {
              // Append set to existing exercise entry
              const newExercises = [...s.exercises];
              newExercises[exerciseIdx] = {
                ...newExercises[exerciseIdx],
                sets: [...newExercises[exerciseIdx].sets, newSet],
              };
              return { ...s, exercises: newExercises };
            }

            // First set for this slot — create new SessionExercise entry
            const newExercise: SessionExercise = {
              slotId,
              exerciseId,
              sets: [newSet],
            };
            return { ...s, exercises: [...s.exercises, newExercise] };
          }),
        })),

      removeSet: (sessionId, slotId, setId) =>
        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id !== sessionId) return s;
            return {
              ...s,
              exercises: s.exercises
                .map((e) => {
                  if (e.slotId !== slotId) return e;
                  // Remove the specific set
                  return { ...e, sets: e.sets.filter((set) => set.id !== setId) };
                })
                // Remove exercise entries that have no sets left (cleanup)
                .filter((e) => e.sets.length > 0),
            };
          }),
        })),

      completeSession: (sessionId) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, completed: true, completedAt: new Date().toISOString() }
              : s
          ),
        })),

      uncompleteSession: (sessionId) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, completed: false, completedAt: undefined }
              : s
          ),
        })),

      isDayCompletedToday: (dayNumber) => {
        const today = getToday();
        return get().sessions.some(
          (s) => s.date === today && s.dayNumber === dayNumber && s.completed
        );
      },

      getSessionsByDate: (date) => get().sessions.filter((s) => s.date === date),

      getCompletedDates: () =>
        get()
          .sessions.filter((s) => s.completed)
          .map((s) => s.date),

      clearSessions: () => set({ sessions: [] }),
    }),
    { name: 'gymapp-workouts' }
  )
);
