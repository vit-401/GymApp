import { useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Repeat } from 'lucide-react';
import { useTimerStore } from '@/stores/timer.store';
import { cn } from '@/utils/cn';

export function Timer() {
  const { remaining, isRunning, defaultDuration, start, pause, reset, repeat, tick } =
    useTimerStore();

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [isRunning, tick]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = defaultDuration > 0 ? remaining / defaultDuration : 0;
  const isFinished = remaining === 0 && !isRunning;

  const handlePlayPause = useCallback(() => {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  }, [isRunning, pause, start]);

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-2 bg-card border-t border-border',
        isFinished && 'bg-success/10'
      )}
    >
      {/* Progress bar behind */}
      <div className="absolute left-0 bottom-0 h-0.5 bg-primary/20 w-full">
        <div
          className="h-full bg-primary transition-all duration-300 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Timer display */}
      <div
        className={cn(
          'font-mono text-2xl font-bold tabular-nums min-w-[5rem] text-center',
          isFinished && 'text-success',
          isRunning && 'text-primary'
        )}
      >
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>

      {/* Controls */}
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
  );
}
