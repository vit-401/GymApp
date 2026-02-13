/**
 * @file Body metrics store (Zustand + persist).
 *
 * Business context:
 * - Users track body weight (lbs) and belly circumference (inches) over time.
 * - Records are timestamped with full ISO datetime for chronological charts.
 * - The MetricsPage renders line charts (via recharts) when 2+ data points exist.
 *
 * Persistence: full metrics array saved to localStorage (key: "gymapp-metrics").
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { fallbackStorage } from '@/utils/storage';
import type { BodyMetric } from '@/types';
import { generateId } from '@/utils/ids';

interface MetricsState {
  metrics: BodyMetric[];
  /** Add a new body measurement with current timestamp. At least one value (weight or bellySize) required. */
  addMetric: (data: { weight?: number; bellySize?: number }) => void;
  /** Delete a single measurement record by ID */
  deleteMetric: (id: string) => void;
  /** Clear all measurement history — used in Settings danger zone */
  clearMetrics: () => void;
}

export const useMetricsStore = create<MetricsState>()(
  persist(
    (set) => ({
      metrics: [],

      addMetric: (data) => {
        const metric: BodyMetric = {
          id: generateId(),
          recordedAt: new Date().toISOString(), // Full ISO datetime for chart X-axis
          ...data,
        };
        set((state) => ({ metrics: [...state.metrics, metric] }));
      },

      deleteMetric: (id) =>
        set((state) => ({ metrics: state.metrics.filter((m) => m.id !== id) })),

      clearMetrics: () => set({ metrics: [] }),
    }),
    { name: 'gymapp-metrics', storage: createJSONStorage(() => fallbackStorage) }
  )
);
