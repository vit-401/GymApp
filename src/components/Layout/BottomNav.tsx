import { NavLink } from 'react-router-dom';
import { Dumbbell, CalendarDays, TrendingUp, ListChecks, Settings } from 'lucide-react';
import { cn } from '@/utils/cn';

const NAV_ITEMS = [
  { to: '/', icon: Dumbbell, label: 'Workout' },
  { to: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { to: '/metrics', icon: TrendingUp, label: 'Metrics' },
  { to: '/exercises', icon: ListChecks, label: 'Exercises' },
  { to: '/settings', icon: Settings, label: 'Settings' },
] as const;

export function BottomNav() {
  return (
    <nav className="flex items-center justify-around bg-card border-t border-border safe-bottom">
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-0.5 py-2 px-3 text-xs transition-colors min-w-[3.5rem]',
              isActive ? 'text-primary' : 'text-muted-foreground'
            )
          }
        >
          <Icon className="h-5 w-5" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
