import { useState, useMemo } from 'react';
import { useTimerStore } from '@/stores/timer.store';
import { useWorkoutStore } from '@/features/workout/stores/workout.store';
import { useExercisesStore } from '@/features/exercises/stores/exercises.store';
import { useMetricsStore } from '@/features/metrics/stores/metrics.store';
import { exportSessions } from '@/features/workout/utils/export';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check, Trash2, Download, Clock, Cog } from 'lucide-react';
import { Link } from 'react-router-dom';

export function SettingsPage() {
  const defaultDuration = useTimerStore((s) => s.defaultDuration);
  const setDefaultDuration = useTimerStore((s) => s.setDefaultDuration);

  const sessions = useWorkoutStore((s) => s.sessions);
  const clearSessions = useWorkoutStore((s) => s.clearSessions);
  const getExerciseById = useExercisesStore((s) => s.getExerciseById);
  const clearMetrics = useMetricsStore((s) => s.clearMetrics);

  const [timerInput, setTimerInput] = useState(String(defaultDuration));
  const [copied, setCopied] = useState(false);

  const completedSessions = useMemo(
    () => sessions.filter((s) => s.completed).sort((a, b) => a.date.localeCompare(b.date)),
    [sessions]
  );

  const exportText = useMemo(
    () => exportSessions(completedSessions, getExerciseById),
    [completedSessions, getExerciseById]
  );

  const handleCopy = async () => {
    await navigator.clipboard.writeText(exportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveTimer = () => {
    const val = parseInt(timerInput, 10);
    if (!isNaN(val) && val > 0) {
      setDefaultDuration(val);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-bold">Settings</h1>

      {/* Timer settings */}
      <div className="bg-card rounded-xl border border-border/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Rest Timer</h3>
        </div>
        <div className="flex gap-2">
          <Input
            type="number"
            inputMode="numeric"
            value={timerInput}
            onChange={(e) => setTimerInput(e.target.value)}
            min={10}
            max={600}
            className="flex-1"
          />
          <span className="text-sm text-muted-foreground self-center">seconds</span>
          <Button size="sm" onClick={handleSaveTimer}>
            Save
          </Button>
        </div>
      </div>

      {/* Program link */}
      <Link to="/program" className="block">
        <div className="bg-card rounded-xl border border-border/50 p-4 hover:border-primary/50 transition-colors">
          <div className="flex items-center gap-2">
            <Cog className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Workout Program</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Configure your 7-day split and assign exercises
          </p>
        </div>
      </Link>

      {/* Export */}
      <div className="bg-card rounded-xl border border-border/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Download className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Export Workouts</h3>
        </div>

        {completedSessions.length === 0 ? (
          <p className="text-xs text-muted-foreground">No completed workouts to export.</p>
        ) : (
          <>
            <pre className="text-xs bg-background rounded-lg p-3 max-h-48 overflow-y-auto whitespace-pre-wrap mb-3 text-muted-foreground">
              {exportText}
            </pre>
            <Button
              variant={copied ? 'success' : 'outline'}
              size="sm"
              onClick={handleCopy}
              className="w-full"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1" /> Copy to Clipboard
                </>
              )}
            </Button>
          </>
        )}
      </div>

      {/* Danger zone */}
      <div className="bg-card rounded-xl border border-destructive/30 p-4">
        <h3 className="text-sm font-semibold text-destructive mb-3">Danger Zone</h3>
        <div className="flex flex-col gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm('Delete ALL workout sessions? This cannot be undone.')) {
                clearSessions();
              }
            }}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Clear All Workouts
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm('Delete ALL body metrics? This cannot be undone.')) {
                clearMetrics();
              }
            }}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Clear All Metrics
          </Button>
        </div>
      </div>
    </div>
  );
}
