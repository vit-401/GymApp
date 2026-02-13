/**
 * @file Rest timer store (Zustand + persist).
 *
 * Business context:
 * - Between sets, users rest for a configurable duration (default 120s).
 * - Timer is visible on every screen via the persistent Timer bar in AppLayout.
 * - Uses wall-clock math (startedAt + elapsed) instead of decrementing state every second,
 *   which prevents drift and survives background tabs on mobile.
 * - Vibrates on completion (if device supports it) to alert the user.
 *
 * Persistence: only `defaultDuration` is saved to localStorage (key: "gymapp-timer").
 * Running state is intentionally NOT persisted — timer resets on page reload.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { fallbackStorage } from '@/utils/storage';

interface TimerState {
  /** Default rest duration in seconds (user-configurable in Settings) */
  defaultDuration: number;
  /** Current remaining seconds on the countdown */
  remaining: number;
  /** Whether timer is actively counting down */
  isRunning: boolean;
  /** Wall-clock timestamp (ms) when timer was started/resumed — used for drift-free counting */
  startedAt: number | null;
  /** Remaining seconds snapshot at the moment timer was started — baseline for elapsed calculation */
  remainingAtStart: number;

  /** Update the default rest duration and reset the timer */
  setDefaultDuration: (seconds: number) => void;
  /** Override the current remaining seconds (used by the "adjust timer" dialog) */
  setRemaining: (seconds: number) => void;
  /** Start or resume the countdown */
  start: () => void;
  /** Pause the countdown, preserving remaining time */
  pause: () => void;
  /** Reset timer to default duration, stop counting */
  reset: () => void;
  /** Restart timer from default duration and immediately start counting */
  repeat: () => void;
  /** Called every ~250ms via setInterval to recalculate remaining from wall clock */
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

      setRemaining: (seconds) =>
        set({
          remaining: seconds,
          isRunning: false,
          startedAt: null,
          remainingAtStart: seconds,
        }),

      start: () => {
        const { remaining } = get();
        if (remaining <= 0) return; // don't start if already at zero
        set({ isRunning: true, startedAt: Date.now(), remainingAtStart: remaining });
      },

      pause: () => {
        const { startedAt, remainingAtStart } = get();
        if (!startedAt) return;
        // Calculate how much time passed since start and update remaining
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
        // Reset to full duration AND immediately start — convenience for back-to-back sets
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

        // Derive remaining from wall clock to prevent drift in background tabs
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        const remaining = Math.max(0, remainingAtStart - elapsed);
        set({ remaining });

        // Timer reached zero — stop and alert user via vibration
        if (remaining <= 0) {
          set({ isRunning: false, startedAt: null });
          if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200, 100, 200]);
          }
        }
      },
    }),
    {
      name: 'gymapp-timer',
      storage: createJSONStorage(() => fallbackStorage),
      // Only persist the default duration — running state resets on reload
      partialize: (state) => ({ defaultDuration: state.defaultDuration }),
    }
  )
);
