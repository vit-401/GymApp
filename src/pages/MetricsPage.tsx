/**
 * @file Metrics page — body weight and belly size tracking with charts.
 *
 * Business context:
 * - Users log body measurements (weight in lbs, belly circumference in inches) to track progress.
 * - Line charts (via recharts) visualize trends when 2+ data points exist.
 * - Two separate charts: Weight Trend (blue line) and Belly Size Trend (amber line).
 * - Measurements are listed in reverse chronological order (newest first) below the charts.
 * - Each record can be individually deleted.
 * - "+" button opens a dialog to add a new measurement.
 *
 * Route: /metrics
 */

import { useState, useMemo } from 'react';
import { useMetricsStore } from '@/features/metrics/stores/metrics.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, TrendingUp, Ruler, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { format, parseISO } from 'date-fns';

export function MetricsPage() {
  const metrics = useMetricsStore((s) => s.metrics);
  const addMetric = useMetricsStore((s) => s.addMetric);
  const deleteMetric = useMetricsStore((s) => s.deleteMetric);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [weight, setWeight] = useState('');
  const [bellySize, setBellySize] = useState('');

  /** Sorted newest-first for the history list display */
  const sortedMetrics = useMemo(
    () => [...metrics].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)),
    [metrics]
  );

  /** Sorted oldest-first for chronological chart rendering */
  const chartData = useMemo(() => {
    return [...metrics]
      .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))
      .map((m) => ({
        id: m.id,
        label: format(parseISO(m.recordedAt), 'MM/dd HH:mm'),
        weight: m.weight ?? null,
        belly: m.bellySize ?? null,
      }));
  }, [metrics]);

  /** Validate and add a new measurement, then close the dialog */
  const handleAdd = () => {
    const w = weight ? parseFloat(weight) : undefined;
    const b = bellySize ? parseFloat(bellySize) : undefined;
    if (w === undefined && b === undefined) return; // At least one value required
    addMetric({ weight: w, bellySize: b });
    setWeight('');
    setBellySize('');
    setDialogOpen(false);
  };

  return (
    <div className="flex flex-col gap-4 p-4 pb-6">
      {/* Page header with add button */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Body Metrics</h1>
        <Button size="icon" onClick={() => setDialogOpen(true)} aria-label="Add record">
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Trend charts — only shown when 2+ data points exist for meaningful visualization */}
      {chartData.length >= 2 && (
        <>
          {/* Weight trend chart (blue line) */}
          {chartData.some((d) => d.weight != null) && (
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                Weight Trend
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#3b82f6' }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Belly size trend chart (amber line) */}
          {chartData.some((d) => d.belly != null) && (
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                <Ruler className="h-3.5 w-3.5 text-warning" />
                Belly Size Trend
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="belly"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#f59e0b' }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {/* Measurement history list (newest first) */}
      <div>
        <h3 className="text-sm font-semibold mb-2">
          History{' '}
          <span className="text-muted-foreground font-normal">({metrics.length})</span>
        </h3>

        {sortedMetrics.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <p>No records yet.</p>
            <p className="text-xs mt-1">
              Tap <span className="text-primary font-bold">+</span> to add your first measurement.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {sortedMetrics.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 bg-card rounded-xl border border-border/50 px-3 py-2.5"
              >
                {/* Measurement date and time */}
                <div className="shrink-0 min-w-[5.5rem]">
                  <p className="text-xs font-medium">
                    {format(parseISO(m.recordedAt), 'MMM d, yyyy')}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {format(parseISO(m.recordedAt), 'hh:mm a')}
                  </p>
                </div>

                {/* Measurement values */}
                <div className="flex flex-1 items-center gap-3">
                  {m.weight != null && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-primary" />
                      <span className="text-sm font-semibold">{m.weight}</span>
                      <span className="text-[10px] text-muted-foreground">lbs</span>
                    </div>
                  )}
                  {m.bellySize != null && (
                    <div className="flex items-center gap-1">
                      <Ruler className="h-3 w-3 text-warning" />
                      <span className="text-sm font-semibold">{m.bellySize}</span>
                      <span className="text-[10px] text-muted-foreground">in</span>
                    </div>
                  )}
                </div>

                {/* Delete record button */}
                <button
                  onClick={() => deleteMetric(m.id)}
                  className="p-1.5 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  aria-label="Delete record"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add measurement dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Add Measurement</DialogTitle>
            <DialogDescription>
              Record your current weight and/or belly size
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 mt-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Weight (lbs)</label>
              <Input
                type="number"
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 180"
                step="0.1"
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Belly Size (inches)</label>
              <Input
                type="number"
                inputMode="decimal"
                value={bellySize}
                onChange={(e) => setBellySize(e.target.value)}
                placeholder="e.g. 34"
                step="0.1"
              />
            </div>

            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Record
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
