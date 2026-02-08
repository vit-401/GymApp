import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WorkoutSession, SessionExercise, WorkoutSet } from '@/types';
import { generateId } from '@/utils/ids';
import { getToday } from '@/utils/date';

interface WorkoutState {
  sessions: WorkoutSession[];
  /** Which program day the user is currently on (1-7) */
  currentDayNumber: number;

  setCurrentDay: (dayNumber: number) => void;

  /** Get or create today's session for a given day */
  getOrCreateSession: (dayNumber: number, dayLabel: string) => WorkoutSession;

  /** Add a set to an exercise within today's session */
  addSet: (sessionId: string, slotId: string, exerciseId: string, set: Omit<WorkoutSet, 'id'>) => void;

  /** Remove a set */
  removeSet: (sessionId: string, slotId: string, setId: string) => void;

  /** Mark session as complete */
  completeSession: (sessionId: string) => void;

  /** Get sessions for a given date */
  getSessionsByDate: (date: string) => WorkoutSession[];

  /** Get all completed dates */
  getCompletedDates: () => string[];

  /** Clear all sessions */
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
        const existing = get().sessions.find(
          (s) => s.date === today && s.dayNumber === dayNumber
        );
        if (existing) return existing;

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
            const exerciseIdx = s.exercises.findIndex(
              (e) => e.slotId === slotId && e.exerciseId === exerciseId
            );
            const newSet: WorkoutSet = { id: generateId(), ...setData };

            if (exerciseIdx >= 0) {
              const newExercises = [...s.exercises];
              newExercises[exerciseIdx] = {
                ...newExercises[exerciseIdx],
                sets: [...newExercises[exerciseIdx].sets, newSet],
              };
              return { ...s, exercises: newExercises };
            }

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
                  return { ...e, sets: e.sets.filter((set) => set.id !== setId) };
                })
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
