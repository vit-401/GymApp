/**
 * @file Root layout component wrapping all pages.
 *
 * Provides the app shell structure:
 * 1. Scrollable content area (renders active route via <Outlet />)
 * 2. Persistent rest timer bar (always visible between content and nav)
 * 3. Bottom navigation bar (tab-based navigation)
 *
 * Uses `h-dvh` (dynamic viewport height) for proper mobile browser support
 * where the address bar affects available height.
 */

import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Timer } from '@/components/Timer/Timer';
import { useTimerStore } from '@/stores/timer.store';
import { cn } from '@/utils/cn';

export function AppLayout() {
  const isRunning = useTimerStore((s) => s.isRunning);
  const remaining = useTimerStore((s) => s.remaining);
  const remainingAtStart = useTimerStore((s) => s.remainingAtStart);

  const bigMinutes = Math.floor(remaining / 60);
  const bigSeconds = remaining % 60;
  const pct = remainingAtStart > 0 ? remaining / remainingAtStart : 0;
  const timerColor = pct > 0.5 ? 'text-success' : pct > 0.2 ? 'text-warning' : 'text-destructive';

  return (
    <div className="relative flex flex-col h-dvh bg-background">
      {/* Pulsing green border overlay — visible on top of all content */}
      {isRunning && (
        <div className="absolute inset-0 z-50 pointer-events-none animate-border-pulse" />
      )}

      {/* Big timer countdown banner — display only, controls stay in bottom bar */}
      {isRunning && (
        <div className="shrink-0 flex items-center justify-center py-2 bg-card/80 border-b border-border/50">
          <span className={cn('font-mono text-5xl font-bold tabular-nums', timerColor)}>
            {String(bigMinutes).padStart(2, '0')}:{String(bigSeconds).padStart(2, '0')}
          </span>
        </div>
      )}

      {/* Scrollable page content — each page renders here via router */}
      <main className="flex-1 overflow-y-auto no-scrollbar">
        <Outlet />
      </main>

      {/* Persistent rest timer — always visible so users can track rest between sets */}
      <div className={cn('relative shrink-0', isRunning && 'animate-timer-top')}>
        <Timer />
      </div>

      {/* Bottom tab navigation — fixed at bottom, never scrolls */}
      <div className="shrink-0">
        <BottomNav />
      </div>
    </div>
  );
}
