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

export function AppLayout() {
  return (
    <div className="flex flex-col h-dvh bg-background">
      {/* Scrollable page content — each page renders here via router */}
      <main className="flex-1 overflow-y-auto no-scrollbar">
        <Outlet />
      </main>

      {/* Persistent rest timer — always visible so users can track rest between sets */}
      <div className="relative shrink-0">
        <Timer />
      </div>

      {/* Bottom tab navigation — fixed at bottom, never scrolls */}
      <div className="shrink-0">
        <BottomNav />
      </div>
    </div>
  );
}
