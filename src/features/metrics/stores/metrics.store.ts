import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BodyMetric } from '@/types';
import { generateId } from '@/utils/ids';

interface MetricsState {
  metrics: BodyMetric[];
  addMetric: (data: { weight?: number; bellySize?: number }) => void;
  deleteMetric: (id: string) => void;
  clearMetrics: () => void;
}

export const useMetricsStore = create<MetricsState>()(
  persist(
    (set) => ({
      metrics: [],

      addMetric: (data) => {
        const metric: BodyMetric = {
          id: generateId(),
          recordedAt: new Date().toISOString(),
          ...data,
        };
        set((state) => ({ metrics: [...state.metrics, metric] }));
      },

      deleteMetric: (id) =>
        set((state) => ({ metrics: state.metrics.filter((m) => m.id !== id) })),

      clearMetrics: () => set({ metrics: [] }),
    }),
    { name: 'gymapp-metrics' }
  )
);
