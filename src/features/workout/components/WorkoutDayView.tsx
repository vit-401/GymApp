/**
 * @file Main workout day view — renders exercise cards for the selected program day.
 *
 * Business context:
 * - Core workout logging screen: shows all exercise slots for the current day.
 * - Each slot renders as an ExerciseCard where users log sets.
 * - "Complete Day" button appears when ALL slots have at least one set logged.
 * - After completion: shows success state with "Copy Summary" and "Edit" buttons.
 * - "Copy Summary" opens a dialog with formatted workout text for clipboard sharing.
 * - "Edit" reopens the workout for modifications (uncompletes the session).
 * - REST days show a rest-day illustration with no exercise cards.
 *
 * Clipboard copy strategy:
 * 1. Try navigator.clipboard.writeText (modern API)
 * 2. Fallback: hidden textarea + document.execCommand('copy') (legacy)
 * 3. Last resort: auto-select text for manual copy
 */

import { useMemo, useCallback, useState, useRef } from 'react';
import { CheckCircle2, Pencil, Copy, Check } from 'lucide-react';
import { useProgramStore } from '@/features/program/stores/program.store';
import { useWorkoutStore } from '@/features/workout/stores/workout.store';
import { useExercisesStore } from '@/features/exercises/stores/exercises.store';
import { ExerciseCard } from './ExerciseCard';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatSessionText } from '@/features/workout/utils/export';
import type { WorkoutSet } from '@/types';

export function WorkoutDayView() {
  /* Store selectors */
  const currentDayNumber = useWorkoutStore((s) => s.currentDayNumber);
  const sessions = useWorkoutStore((s) => s.sessions);
  const getOrCreateSession = useWorkoutStore((s) => s.getOrCreateSession);
  const addSet = useWorkoutStore((s) => s.addSet);
  const removeSet = useWorkoutStore((s) => s.removeSet);
  const completeSession = useWorkoutStore((s) => s.completeSession);
  const uncompleteSession = useWorkoutStore((s) => s.uncompleteSession);
  const getExerciseById = useExercisesStore((s) => s.getExerciseById);

  const days = useProgramStore((s) => s.days);

  /** Find the current program day definition */
  const currentDay = useMemo(
    () => days.find((d) => d.dayNumber === currentDayNumber),
    [days, currentDayNumber]
  );

  /** Get or create today's session for the selected day (idempotent) */
  const session = useMemo(() => {
    if (!currentDay) return null;
    return getOrCreateSession(currentDay.dayNumber, currentDay.label);
  }, [currentDay, getOrCreateSession, sessions]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Get fresh session data from store (reactive to set additions/removals) */
  const freshSession = sessions.find((s) => s.id === session?.id);
  const isCompleted = freshSession?.completed ?? false;

  /** Check if every slot has at least one set — gates the "Complete Day" button */
  const allExercisesCompleted =
    (currentDay?.slots.length ?? 0) > 0 &&
    (currentDay?.slots.every((slot) => {
      const se = freshSession?.exercises.find((e) => e.slotId === slot.id);
      return (se?.sets.length ?? 0) > 0;
    }) ?? false);

  /* All hooks must be declared before any early returns (React rules of hooks) */

  /** Add a set to the current session via the workout store */
  const handleAddSet = useCallback(
    (slotId: string, exerciseId: string, setData: Omit<WorkoutSet, 'id'>) => {
      if (!session) return;
      addSet(session.id, slotId, exerciseId, setData);
    },
    [session, addSet]
  );

  /** Remove a set from the current session via the workout store */
  const handleRemoveSet = useCallback(
    (slotId: string, setId: string) => {
      if (!session) return;
      removeSet(session.id, slotId, setId);
    },
    [session, removeSet]
  );

  /** Mark the current session as completed */
  const handleComplete = useCallback(() => {
    if (!session) return;
    completeSession(session.id);
  }, [session, completeSession]);

  /** Reopen a completed session for editing */
  const handleEdit = useCallback(() => {
    if (!session) return;
    uncompleteSession(session.id);
  }, [session, uncompleteSession]);

  /* Share/copy dialog state */
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const shareRef = useRef<HTMLPreElement>(null);

  /** Generate formatted workout summary text for clipboard */
  const shareText = useMemo(() => {
    if (!freshSession || !currentDay) return '';
    return formatSessionText(freshSession, currentDay, getExerciseById);
  }, [freshSession, currentDay, getExerciseById]);

  /** Select all text in the share preview (for manual copy fallback on mobile) */
  const selectShareText = useCallback(() => {
    const el = shareRef.current;
    if (!el) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, []);

  /**
   * Multi-strategy clipboard copy:
   * 1. navigator.clipboard.writeText (modern, requires HTTPS)
   * 2. Hidden textarea + execCommand (legacy fallback)
   * 3. Auto-select text for manual copy (last resort on restrictive mobile browsers)
   */
  const handleCopy = useCallback(async () => {
    if (!shareText) return;
    setCopyError(null);

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
      } else {
        throw new Error('Clipboard API not available');
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: hidden textarea technique
      try {
        const textarea = document.createElement('textarea');
        textarea.value = shareText;
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
        // Last resort: select text for manual copy
        selectShareText();
        setCopyError('Copy failed. Text selected — tap Copy.');
      }
    }
  }, [shareText, selectShareText]);

  /* Early returns — only after all hooks are declared */
  if (!currentDay) return null;

  /* REST day — show rest illustration, no exercise cards */
  if (currentDay.label === 'REST') {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="text-6xl mb-4">😴</div>
        <h2 className="text-xl font-bold mb-2">Rest Day</h2>
        <p className="text-muted-foreground text-sm">Recovery is part of the process. Rest up!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-4 pb-4">
      {/* Render one ExerciseCard per program slot */}
      {currentDay.slots.map((slot) => {
        const sessionExercise = freshSession?.exercises.find(
          (e) => e.slotId === slot.id
        );

        return (
          <ExerciseCard
            key={slot.id}
            slot={slot}
            sessionExercise={sessionExercise}
            onAddSet={handleAddSet}
            onRemoveSet={handleRemoveSet}
            readOnly={isCompleted}
          />
        );
      })}

      {/* "Complete Day" button — enabled only when all slots have at least one set */}
      {!isCompleted && currentDay.slots.length > 0 && (
        <Button
          variant="success"
          size="lg"
          className="mt-2"
          disabled={!allExercisesCompleted}
          onClick={handleComplete}
        >
          <CheckCircle2 className="h-5 w-5 mr-2" />
          Complete Day
        </Button>
      )}

      {/* Completed state: success message + copy summary / edit buttons */}
      {isCompleted && (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="flex items-center gap-2 text-emerald-500">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-semibold">Workout Completed!</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShareOpen(true)}
              className="gap-1.5"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy Summary
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="gap-1.5"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          </div>
        </div>
      )}

      {/* Workout summary share dialog — shows formatted text with copy/select actions */}
      <Dialog
        open={shareOpen}
        onOpenChange={(open) => {
          setShareOpen(open);
          if (!open) {
            setCopied(false);
            setCopyError(null);
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Workout Summary</DialogTitle>
          </DialogHeader>
          {/* Copy status indicator */}
          {(copied || copyError) && (
            <div
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs ${
                copyError ? 'bg-destructive/15 text-destructive' : 'bg-emerald-600/15 text-emerald-500'
              }`}
            >
              {copied ? <Check className="h-3 w-3" /> : null}
              {copied ? 'Copied' : copyError}
            </div>
          )}
          {/* Formatted workout text — click to select all */}
          <pre
            ref={shareRef}
            className="whitespace-pre-wrap text-sm bg-secondary/50 rounded-lg p-3 max-h-[60vh] overflow-y-auto font-mono leading-relaxed"
            onClick={selectShareText}
          >
            {shareText}
          </pre>
          <div className="flex gap-2">
            <Button onClick={handleCopy} className="flex-1 gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button variant="outline" onClick={selectShareText} className="flex-1">
              Select Text
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
