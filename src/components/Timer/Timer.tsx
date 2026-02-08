/**
 * @file Rest timer UI component — persistent bar between workout content and nav.
 *
 * Business context:
 * - Users rest between workout sets for a configurable duration (default 120 seconds).
 * - Timer is always visible regardless of which page is active.
 * - Tapping the time display opens a dialog to adjust the current countdown value.
 * - Controls: play/pause, reset to default, repeat (restart and auto-start).
 * - Progress bar at bottom shows visual countdown progress.
 * - When finished: green highlight, vibration alert (if supported).
 *
 * Tick interval: 250ms for smooth display updates (actual time calculation is wall-clock based).
 */

import { useEffect, useCallback, useState } from 'react';
import { Play, Pause, RotateCcw, Repeat } from 'lucide-react';
import { useTimerStore } from '@/stores/timer.store';
import { cn } from '@/utils/cn';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Timer() {
  const { remaining, isRunning, defaultDuration, start, pause, reset, repeat, tick, setRemaining } =
    useTimerStore();

  /* State for the "adjust timer" dialog */
  const [isAdjustOpen, setAdjustOpen] = useState(false);
  const [secondsInput, setSecondsInput] = useState(remaining.toString());

  /* Run tick every 250ms while timer is active */
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [isRunning, tick]);

  /* Derived display values */
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = defaultDuration > 0 ? remaining / defaultDuration : 0;
  const isFinished = remaining === 0 && !isRunning;

  /* Sync dialog input with current remaining when dialog opens */
  useEffect(() => {
    if (isAdjustOpen) {
      setSecondsInput(remaining.toString());
    }
  }, [isAdjustOpen, remaining]);

  /** Toggle between play and pause */
  const handlePlayPause = useCallback(() => {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  }, [isRunning, pause, start]);

  /** Apply the user-entered seconds value and close the dialog */
  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const secondsValue = parseInt(secondsInput, 10);
    if (Number.isNaN(secondsValue) || secondsValue <= 0) return;
    setRemaining(secondsValue);
    setAdjustOpen(false);
  };

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-2 bg-card border-t border-border',
          isFinished && 'bg-success/10' // Green tint when timer reaches zero
        )}
      >
        {/* Thin progress bar at the very bottom of the timer bar */}
        <div className="absolute left-0 bottom-0 h-0.5 bg-primary/20 w-full">
          <div
            className="h-full bg-primary transition-all duration-300 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        {/* Tappable time display — opens adjust dialog */}
        <button
          type="button"
          onClick={() => setAdjustOpen(true)}
          className={cn(
            'font-mono text-2xl font-bold tabular-nums min-w-[5rem] text-center',
            'rounded-md px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            isFinished && 'text-success',
            isRunning && 'text-primary'
          )}
          aria-label="Set timer seconds"
        >
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </button>

        {/* Control buttons: play/pause, reset, repeat */}
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={handlePlayPause}
            className="flex items-center justify-center h-9 w-9 rounded-full bg-primary text-primary-foreground active:scale-95 transition-transform"
            aria-label={isRunning ? 'Pause' : 'Start'}
          >
            {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </button>

          <button
            onClick={reset}
            className="flex items-center justify-center h-9 w-9 rounded-full bg-secondary text-secondary-foreground active:scale-95 transition-transform"
            aria-label="Reset"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            onClick={repeat}
            className="flex items-center justify-center h-9 w-9 rounded-full bg-secondary text-secondary-foreground active:scale-95 transition-transform"
            aria-label="Repeat"
          >
            <Repeat className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Dialog for manually adjusting the current timer value */}
      <Dialog open={isAdjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Set timer seconds</DialogTitle>
            <DialogDescription>Default stays at {defaultDuration} seconds.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdjustSubmit} className="flex flex-col gap-3 mt-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Seconds</label>
              <Input
                type="number"
                inputMode="numeric"
                value={secondsInput}
                onChange={(e) => setSecondsInput(e.target.value)}
                placeholder="120"
                min={1}
                autoFocus
              />
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" onClick={() => setAdjustOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="ml-auto">
                Set
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
