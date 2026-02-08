import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TimerState {
  /** Duration in seconds for rest timer */
  defaultDuration: number;
  /** Current remaining seconds */
  remaining: number;
  /** Whether timer is actively counting down */
  isRunning: boolean;
  /** Timestamp when timer was started/resumed (for accurate drift-free counting) */
  startedAt: number | null;
  /** Remaining at the moment the timer was started/resumed */
  remainingAtStart: number;

  setDefaultDuration: (seconds: number) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  repeat: () => void;
  tick: () => void;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      defaultDuration: 120,
      remaining: 120,
      isRunning: false,
      startedAt: null,
      remainingAtStart: 120,

      setDefaultDuration: (seconds) =>
        set({ defaultDuration: seconds, remaining: seconds, isRunning: false, startedAt: null }),

      start: () => {
        const { remaining } = get();
        if (remaining <= 0) return;
        set({ isRunning: true, startedAt: Date.now(), remainingAtStart: remaining });
      },

      pause: () => {
        const { startedAt, remainingAtStart } = get();
        if (!startedAt) return;
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        const remaining = Math.max(0, remainingAtStart - elapsed);
        set({ isRunning: false, remaining, startedAt: null });
      },

      reset: () => {
        const { defaultDuration } = get();
        set({ remaining: defaultDuration, isRunning: false, startedAt: null });
      },

      repeat: () => {
        const { defaultDuration } = get();
        set({
          remaining: defaultDuration,
          isRunning: true,
          startedAt: Date.now(),
          remainingAtStart: defaultDuration,
        });
      },

      tick: () => {
        const { isRunning, startedAt, remainingAtStart } = get();
        if (!isRunning || !startedAt) return;
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        const remaining = Math.max(0, remainingAtStart - elapsed);
        set({ remaining });
        if (remaining <= 0) {
          set({ isRunning: false, startedAt: null });
          // Vibrate if supported
          if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200, 100, 200]);
          }
        }
      },
    }),
    {
      name: 'gymapp-timer',
      partialize: (state) => ({ defaultDuration: state.defaultDuration }),
    }
  )
);
