/**
 * @file Settings page — app configuration, data export, and danger zone.
 *
 * Business context:
 * - Rest Timer: configure the default rest timer duration (in seconds).
 * - Program Link: quick navigation to the program configuration page.
 * - Export Workouts: formats all completed sessions as plain text for clipboard copy.
 *   Uses the same multi-strategy clipboard approach as WorkoutDayView (navigator → textarea fallback → select).
 * - Danger Zone: destructive actions (clear all workouts, clear all metrics) with confirmation dialogs.
 *
 * Route: /settings
 */

import { useState, useMemo, useRef, useCallback } from 'react';
import { useTimerStore } from '@/stores/timer.store';
import { useWorkoutStore } from '@/features/workout/stores/workout.store';
import { useProgramStore } from '@/features/program/stores/program.store';
import { useExercisesStore } from '@/features/exercises/stores/exercises.store';
import { useMetricsStore } from '@/features/metrics/stores/metrics.store';
import { formatSessionText } from '@/features/workout/utils/export';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check, Trash2, Download, Clock, Cog } from 'lucide-react';
import { Link } from 'react-router-dom';

export function SettingsPage() {
  /* Timer settings */
  const defaultDuration = useTimerStore((s) => s.defaultDuration);
  const setDefaultDuration = useTimerStore((s) => s.setDefaultDuration);

  /* Data stores for export and danger zone */
  const sessions = useWorkoutStore((s) => s.sessions);
  const clearSessions = useWorkoutStore((s) => s.clearSessions);
  const days = useProgramStore((s) => s.days);
  const getExerciseById = useExercisesStore((s) => s.getExerciseById);
  const clearMetrics = useMetricsStore((s) => s.clearMetrics);

  /* Local UI state */
  const [timerInput, setTimerInput] = useState(String(defaultDuration));
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const exportRef = useRef<HTMLPreElement>(null);

  /** Filter and sort completed sessions for export (oldest first for chronological reading) */
  const completedSessions = useMemo(
    () => sessions.filter((s) => s.completed).sort((a, b) => a.date.localeCompare(b.date)),
    [sessions]
  );

  /** Generate formatted export text — all completed sessions separated by horizontal rules */
  const exportText = useMemo(() => {
    if (completedSessions.length === 0) return '';

    return completedSessions
      .map((session) => {
        // Find the matching program day for slot → muscle group label resolution
        const programDay = days.find((d) => d.dayNumber === session.dayNumber) ?? {
          dayNumber: session.dayNumber,
          label: session.dayLabel,
          slots: [],
        };
        return formatSessionText(session, programDay, getExerciseById);
      })
      .join('\n\n---\n\n');
  }, [completedSessions, days, getExerciseById]);

  /** Select all export text for manual copy fallback */
  const selectExportText = useCallback(() => {
    const el = exportRef.current;
    if (!el) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, []);

  /** Multi-strategy clipboard copy (same approach as WorkoutDayView) */
  const handleCopy = async () => {
    if (!exportText) return;
    setCopyError(null);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(exportText);
      } else {
        throw new Error('Clipboard API not available');
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: hidden textarea technique
      try {
        const textarea = document.createElement('textarea');
        textarea.value = exportText;
        textarea.readOnly = true;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        selectExportText();
        setCopyError('Copy failed. Text selected — tap Copy.');
      }
    }
  };

  /** Save the timer duration input to the store */
  const handleSaveTimer = () => {
    const val = parseInt(timerInput, 10);
    if (!isNaN(val) && val > 0) {
      setDefaultDuration(val);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-bold">Settings</h1>

      {/* ── Rest Timer configuration ── */}
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

      {/* ── Program configuration link ── */}
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

      {/* ── Export completed workouts ── */}
      <div className="bg-card rounded-xl border border-border/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Download className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Export Workouts</h3>
        </div>

        {completedSessions.length === 0 ? (
          <p className="text-xs text-muted-foreground">No completed workouts to export.</p>
        ) : (
          <>
            {/* Formatted export preview — click to select all */}
            <pre
              ref={exportRef}
              className="text-xs bg-background rounded-lg p-3 max-h-48 overflow-y-auto whitespace-pre-wrap mb-3 text-muted-foreground"
              onClick={selectExportText}
            >
              {exportText}
            </pre>
            {copyError && (
              <div className="mb-2 text-xs text-destructive">{copyError}</div>
            )}
            <div className="flex gap-2">
              <Button
                variant={copied ? 'success' : 'outline'}
                size="sm"
                onClick={handleCopy}
                className="flex-1"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={selectExportText} className="flex-1">
                Select Text
              </Button>
            </div>
          </>
        )}
      </div>

      {/* ── Danger Zone: destructive data operations ── */}
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
