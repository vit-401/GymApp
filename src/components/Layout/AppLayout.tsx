import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Timer } from '@/components/Timer/Timer';

export function AppLayout() {
  return (
    <div className="flex flex-col h-dvh bg-background">
      {/* Scrollable content area */}
      <main className="flex-1 overflow-y-auto no-scrollbar">
        <Outlet />
      </main>

      {/* Persistent timer - always visible */}
      <div className="relative shrink-0">
        <Timer />
      </div>

      {/* Bottom navigation */}
      <div className="shrink-0">
        <BottomNav />
      </div>
    </div>
  );
}
